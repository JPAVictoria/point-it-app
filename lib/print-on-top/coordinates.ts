import { TextAlignment } from "./types";

/**
 * Minimal font metrics contract needed for coordinate conversion. pdf-lib's
 * `PDFFont` satisfies this shape, so the real font object can be passed
 * straight through at render time; a plain stub object satisfies it in tests.
 */
export interface FontMetrics {
  heightAtSize(size: number, options?: { descender?: boolean }): number;
  widthOfTextAtSize(text: string, size: number): number;
}

export interface DrawParams {
  /** X passed to page.drawText — already adjusted for alignment. */
  x: number;
  /** Y passed to page.drawText — the font baseline, in pdf-lib's bottom-left origin. */
  y: number;
}

/**
 * Converts a field's editor-space position (top-left origin, top-left corner
 * of the text em-box) into the pdf-lib baseline position (bottom-left
 * origin) used by `page.drawText`.
 *
 * The vertical offset from the top of the em-box to the baseline is the
 * font's ascent at the given size — read directly from the font's own
 * metrics rather than an approximated ratio, so it matches whichever
 * standard font is configured.
 */
export function editorToBaseline(
  x: number,
  y: number,
  fontSize: number,
  pageHeightPt: number,
  font: FontMetrics
): number {
  const ascent = font.heightAtSize(fontSize, { descender: false });
  return pageHeightPt - y - ascent;
}

/**
 * Computes the final x for `page.drawText`, shifting left/right from the
 * field's anchor x according to its alignment and the rendered text width.
 * `anchorX` is always the field's stored top-left x; for "center"/"right"
 * alignment the text is measured and shifted back so it stays anchored
 * within the field's box.
 */
export function alignText(
  anchorX: number,
  text: string,
  fontSize: number,
  alignment: TextAlignment,
  font: FontMetrics,
  maxWidth?: number
): number {
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const boxWidth = maxWidth ?? textWidth;

  switch (alignment) {
    case "left":
      return anchorX;
    case "center":
      return anchorX + Math.max(0, (boxWidth - textWidth) / 2);
    case "right":
      return anchorX + Math.max(0, boxWidth - textWidth);
  }
}

/**
 * Full conversion from a field's editor-space top-left (x, y) to the
 * pdf-lib draw position (baseline, bottom-left origin, alignment-adjusted).
 */
export function fieldToDrawParams(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  alignment: TextAlignment,
  pageHeightPt: number,
  font: FontMetrics,
  maxWidth?: number
): DrawParams {
  return {
    x: alignText(x, text, fontSize, alignment, font, maxWidth),
    y: editorToBaseline(x, y, fontSize, pageHeightPt, font),
  };
}
