import { describe, expect, it } from "vitest";
import { createEmptyLayout, createTextField } from "./factory";
import {
  LayoutValidationError,
  MAX_FIELDS,
  parseAuthorName,
  parseLayoutContent,
  parseLayoutId,
} from "./layout-validation";

const LAYOUT_ID = "0b6a3c2e-6f1d-4c55-9f0e-2b8f1a7d9c11";
const IMAGE_ID = "5d2c9a1e-3b4f-4a6d-8e7c-1f2a3b4c5d6e";

function validContent() {
  const layout = createEmptyLayout("Invoice");
  layout.fields = [createTextField(10, 20)];
  return {
    name: layout.name,
    page: layout.page,
    fields: layout.fields,
    background: {
      storagePath: `${LAYOUT_ID}/${IMAGE_ID}.png`,
      thumbnailPath: `${LAYOUT_ID}/${IMAGE_ID}.thumb.jpg`,
      naturalWidthPx: 1700,
      naturalHeightPx: 2200,
      fitMode: "contain",
      frame: { x: 0, y: 0, width: 612, height: 792 },
    },
  };
}

describe("parseLayoutContent", () => {
  it("accepts a well-formed layout and keeps only known keys", () => {
    const input = { ...validContent(), id: "spoofed", version: 99, extra: "dropped" };
    const parsed = parseLayoutContent(input, LAYOUT_ID);
    expect(Object.keys(parsed).sort()).toEqual(["background", "fields", "name", "page"]);
    expect(parsed.fields).toHaveLength(1);
    expect(parsed.background?.frame?.width).toBe(612);
  });

  it("allows a layout without an image", () => {
    expect(parseLayoutContent({ ...validContent(), background: null }, LAYOUT_ID).background).toBeNull();
  });

  it("rejects image paths outside the layout's own folder", () => {
    const content = validContent();
    content.background.storagePath = `11111111-1111-1111-1111-111111111111/${IMAGE_ID}.png`;
    expect(() => parseLayoutContent(content, LAYOUT_ID)).toThrow(LayoutValidationError);
  });

  it("rejects path traversal in the thumbnail path", () => {
    const content = validContent();
    content.background.thumbnailPath = `${LAYOUT_ID}/../secrets.thumb.jpg`;
    expect(() => parseLayoutContent(content, LAYOUT_ID)).toThrow(/thumbnail/);
  });

  it("rejects a blank name, bad numbers and unknown fonts", () => {
    expect(() => parseLayoutContent({ ...validContent(), name: "   " }, LAYOUT_ID)).toThrow(/empty/);
    const badPage = validContent();
    badPage.page = { ...badPage.page, widthPt: Number.NaN };
    expect(() => parseLayoutContent(badPage, LAYOUT_ID)).toThrow(/widthPt/);
    const badFont = validContent();
    badFont.fields = [{ ...badFont.fields[0], fontFamily: "Comic-Sans" as never }];
    expect(() => parseLayoutContent(badFont, LAYOUT_ID)).toThrow(/fontFamily/);
  });

  it("caps the number of fields", () => {
    const content = validContent();
    content.fields = Array.from({ length: MAX_FIELDS + 1 }, () => createTextField(0, 0));
    expect(() => parseLayoutContent(content, LAYOUT_ID)).toThrow(/at most/);
  });
});

describe("small parsers", () => {
  it("validates layout ids", () => {
    expect(parseLayoutId(LAYOUT_ID)).toBe(LAYOUT_ID);
    expect(() => parseLayoutId("1; drop table layouts")).toThrow(LayoutValidationError);
  });

  it("normalizes author names", () => {
    expect(parseAuthorName("  Ana  ")).toBe("Ana");
    expect(parseAuthorName("   ")).toBeNull();
    expect(parseAuthorName(undefined)).toBeNull();
    expect(() => parseAuthorName("x".repeat(61))).toThrow();
  });
});
