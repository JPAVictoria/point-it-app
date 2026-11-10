import { BackgroundImage, ImageFrame } from "./types";

export const MIN_FRAME_SIZE_PT = 10;

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** The frame an image occupies when fitted to the page with the given mode. */
export function fitImageFrame(
  pageWidthPt: number,
  pageHeightPt: number,
  background: Pick<BackgroundImage, "naturalWidthPx" | "naturalHeightPx">,
  mode: BackgroundImage["fitMode"]
): ImageFrame {
  if (mode === "stretch") return { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt };
  const scale = Math.min(
    pageWidthPt / background.naturalWidthPx,
    pageHeightPt / background.naturalHeightPx
  );
  const width = background.naturalWidthPx * scale;
  const height = background.naturalHeightPx * scale;
  return { x: (pageWidthPt - width) / 2, y: (pageHeightPt - height) / 2, width, height };
}

/** The frame the image is actually drawn in: the manual frame if set, otherwise the fit-mode frame. */
export function resolveImageFrame(
  pageWidthPt: number,
  pageHeightPt: number,
  background: BackgroundImage
): ImageFrame {
  return background.frame ?? fitImageFrame(pageWidthPt, pageHeightPt, background, background.fitMode);
}

/**
 * Resizes `start` by dragging `handle` by (dx, dy) points. The opposite
 * edge/corner stays fixed. Corner handles keep the aspect ratio when
 * `keepAspect` is true; edge handles always stretch a single axis.
 */
export function resizeFrame(
  start: ImageFrame,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  keepAspect: boolean
): ImageFrame {
  const left = handle.includes("w");
  const right = handle.includes("e");
  const top = handle.startsWith("n");
  const bottom = handle.startsWith("s");

  let width = start.width + (right ? dx : left ? -dx : 0);
  let height = start.height + (bottom ? dy : top ? -dy : 0);

  const isCorner = (left || right) && (top || bottom);
  if (keepAspect && isCorner) {
    const ratio = start.width / start.height;
    // Follow whichever axis the pointer moved further, proportionally.
    if (Math.abs(width / start.width - 1) >= Math.abs(height / start.height - 1)) {
      height = width / ratio;
    } else {
      width = height * ratio;
    }
    const minWidth = Math.max(MIN_FRAME_SIZE_PT, MIN_FRAME_SIZE_PT * ratio);
    if (width < minWidth) {
      width = minWidth;
      height = width / ratio;
    }
  } else {
    width = Math.max(MIN_FRAME_SIZE_PT, width);
    height = Math.max(MIN_FRAME_SIZE_PT, height);
  }

  return {
    x: left ? start.x + start.width - width : start.x,
    y: top ? start.y + start.height - height : start.y,
    width,
    height,
  };
}
