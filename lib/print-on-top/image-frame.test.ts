import { describe, expect, it } from "vitest";
import { fitImageFrame, MIN_FRAME_SIZE_PT, resizeFrame } from "./image-frame";

const start = { x: 100, y: 100, width: 200, height: 100 };

describe("fitImageFrame", () => {
  it("letterboxes and centers for contain", () => {
    const frame = fitImageFrame(600, 800, { naturalWidthPx: 1000, naturalHeightPx: 500 }, "contain");
    expect(frame).toEqual({ x: 0, y: 250, width: 600, height: 300 });
  });

  it("fills the page for stretch", () => {
    const frame = fitImageFrame(600, 800, { naturalWidthPx: 1000, naturalHeightPx: 500 }, "stretch");
    expect(frame).toEqual({ x: 0, y: 0, width: 600, height: 800 });
  });
});

describe("resizeFrame", () => {
  it("keeps the aspect ratio and anchors the opposite corner when dragging a corner", () => {
    const frame = resizeFrame(start, "se", 100, 0, true);
    expect(frame).toEqual({ x: 100, y: 100, width: 300, height: 150 });
  });

  it("moves the origin when dragging the top-left corner", () => {
    const frame = resizeFrame(start, "nw", -100, 0, true);
    expect(frame).toEqual({ x: 0, y: 50, width: 300, height: 150 });
  });

  it("resizes freely from a corner when aspect is not kept", () => {
    const frame = resizeFrame(start, "se", 100, 10, false);
    expect(frame).toEqual({ x: 100, y: 100, width: 300, height: 110 });
  });

  it("stretches only one axis from an edge handle", () => {
    expect(resizeFrame(start, "e", 50, 999, true)).toEqual({ x: 100, y: 100, width: 250, height: 100 });
    expect(resizeFrame(start, "n", 999, 30, true)).toEqual({ x: 100, y: 130, width: 200, height: 70 });
  });

  it("never shrinks below the minimum size", () => {
    const frame = resizeFrame(start, "w", 1000, 0, false);
    expect(frame.width).toBe(MIN_FRAME_SIZE_PT);
    expect(frame.x).toBe(start.x + start.width - MIN_FRAME_SIZE_PT);
  });
});
