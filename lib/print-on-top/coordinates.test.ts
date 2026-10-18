import { describe, expect, it } from "vitest";
import { alignText, editorToBaseline, fieldToDrawParams, FontMetrics } from "./coordinates";

/** A stub font with deterministic, easy-to-check-by-hand metrics. */
function stubFont(opts: { ascentRatio?: number; widthPerChar?: number } = {}): FontMetrics {
  const ascentRatio = opts.ascentRatio ?? 0.8;
  const widthPerChar = opts.widthPerChar ?? 6;
  return {
    heightAtSize: (size) => size * ascentRatio,
    widthOfTextAtSize: (text, size) => text.length * widthPerChar * (size / 12),
  };
}

describe("editorToBaseline", () => {
  it("flips the top-left Y into pdf-lib's bottom-left baseline, offset by ascent", () => {
    const font = stubFont({ ascentRatio: 0.8 });
    // page is 500pt tall, field top is 100pt from the top, font size 20 -> ascent 16
    const baseline = editorToBaseline(0, 100, 20, 500, font);
    expect(baseline).toBe(500 - 100 - 16);
  });

  it("a field at the very top of the page lands near the top edge, not off-page", () => {
    const font = stubFont({ ascentRatio: 0.8 });
    const baseline = editorToBaseline(0, 0, 10, 792, font);
    expect(baseline).toBeCloseTo(792 - 8, 10);
    expect(baseline).toBeLessThan(792);
  });
});

describe("alignText", () => {
  const font = stubFont({ widthPerChar: 6 }); // at size 12: 6pt per char

  it("left alignment keeps the anchor x unchanged", () => {
    expect(alignText(50, "hi", 12, "left", font)).toBe(50);
  });

  it("center alignment centers the text within maxWidth", () => {
    // "hi" at size 12 is 2 * 6 = 12pt wide, box is 100pt wide
    const x = alignText(50, "hi", 12, "center", font, 100);
    expect(x).toBeCloseTo(50 + (100 - 12) / 2, 10);
  });

  it("right alignment pushes the text to the end of maxWidth", () => {
    const x = alignText(50, "hi", 12, "right", font, 100);
    expect(x).toBeCloseTo(50 + (100 - 12), 10);
  });

  it("center/right alignment with no maxWidth is a no-op (box == text width)", () => {
    expect(alignText(50, "hi", 12, "center", font)).toBe(50);
    expect(alignText(50, "hi", 12, "right", font)).toBe(50);
  });
});

describe("fieldToDrawParams", () => {
  it("combines alignment and baseline conversion in one call", () => {
    const font = stubFont({ ascentRatio: 0.8, widthPerChar: 6 });
    const result = fieldToDrawParams("hi", 50, 100, 12, "right", 500, font, 100);
    expect(result.x).toBeCloseTo(50 + (100 - 12), 10);
    expect(result.y).toBe(500 - 100 - 12 * 0.8);
  });
});
