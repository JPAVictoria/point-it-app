import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { FieldPosition, LayoutConfig, LayoutValues, StandardFontFamily } from "./types";
import { fieldToDrawParams } from "./coordinates";

const STANDARD_FONT_MAP: Record<StandardFontFamily, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  "Helvetica-Bold": StandardFonts.HelveticaBold,
  "Helvetica-Oblique": StandardFonts.HelveticaOblique,
  "Helvetica-BoldOblique": StandardFonts.HelveticaBoldOblique,
  "Times-Roman": StandardFonts.TimesRoman,
  "Times-Bold": StandardFonts.TimesRomanBold,
  "Times-Italic": StandardFonts.TimesRomanItalic,
  "Times-BoldItalic": StandardFonts.TimesRomanBoldItalic,
  Courier: StandardFonts.Courier,
  "Courier-Bold": StandardFonts.CourierBold,
  "Courier-Oblique": StandardFonts.CourierOblique,
  "Courier-BoldOblique": StandardFonts.CourierBoldOblique,
};

export const STANDARD_FONT_FAMILIES = Object.keys(
  STANDARD_FONT_MAP
) as StandardFontFamily[];

/** Wraps `text` into lines no wider than `maxWidth` at the given font/size. */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

function drawField(
  page: PDFPage,
  font: PDFFont,
  pageHeightPt: number,
  field: LayoutConfig["fields"][number],
  value: string
) {
  if (!field.enabled || value === "") return;

  const lines = field.maxWidth
    ? wrapText(value, font, field.fontSize, field.maxWidth)
    : [value];

  const lineHeight = font.heightAtSize(field.fontSize, { descender: true });
  const maxLines = field.maxHeight
    ? Math.max(1, Math.floor(field.maxHeight / lineHeight))
    : lines.length;

  lines.slice(0, maxLines).forEach((line, index) => {
    const lineY = field.y + index * lineHeight;
    const { x, y } = fieldToDrawParams(
      line,
      field.x,
      lineY,
      field.fontSize,
      field.alignment,
      pageHeightPt,
      font,
      field.maxWidth
    );
    page.drawText(line, {
      x,
      y,
      size: field.fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: field.maxWidth,
    });
  });
}

/** Returns a loader that embeds each standard font into `pdfDoc` at most once. */
function createFontLoader(pdfDoc: PDFDocument) {
  const fontCache = new Map<StandardFontFamily, PDFFont>();
  return async function getFont(family: StandardFontFamily): Promise<PDFFont> {
    const cached = fontCache.get(family);
    if (cached) return cached;
    const font = await pdfDoc.embedFont(STANDARD_FONT_MAP[family]);
    fontCache.set(family, font);
    return font;
  };
}

/**
 * Renders a layout filled with `values` into a PDF using pdf-lib. This is
 * the single rendering path shared by the editor's live preview and (in the
 * future) the real print-on-top document generators — both must call this
 * function so preview and final output can never drift apart.
 *
 * The background reference image is intentionally never drawn here.
 */
export async function renderLayoutToPdf(
  layout: LayoutConfig,
  values: LayoutValues
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([layout.page.widthPt, layout.page.heightPt]);

  const getFont = createFontLoader(pdfDoc);

  for (const field of layout.fields) {
    const font = await getFont(field.fontFamily);
    const value = values[field.name] ?? field.sampleValue;
    drawField(page, font, layout.page.heightPt, field, value);
  }

  return pdfDoc.save();
}

/** Convenience helper for the editor's "Preview" action: renders with each field's own sample value. */
export function renderLayoutPreview(layout: LayoutConfig): Promise<Uint8Array> {
  const values: LayoutValues = {};
  for (const field of layout.fields) {
    values[field.name] = field.sampleValue;
  }
  return renderLayoutToPdf(layout, values);
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolves each enabled field to its text and the exact (x, y) passed to
 * pdf-lib's `page.drawText` for its first line: PDF points, bottom-left
 * origin, baseline y, alignment applied. This is what JSON export emits so
 * positions can be pasted straight into a print-on-top template.
 */
export async function computeFieldPositions(layout: LayoutConfig): Promise<FieldPosition[]> {
  const pdfDoc = await PDFDocument.create();
  const getFont = createFontLoader(pdfDoc);
  const positions: FieldPosition[] = [];

  for (const field of layout.fields) {
    if (!field.enabled) continue;
    const text = field.sampleValue || field.label;
    const font = await getFont(field.fontFamily);
    const { x, y } = fieldToDrawParams(
      text,
      field.x,
      field.y,
      field.fontSize,
      field.alignment,
      layout.page.heightPt,
      font,
      field.maxWidth
    );
    positions.push({ text, x: roundTo2(x), y: roundTo2(y) });
  }

  return positions;
}
