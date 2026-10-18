/**
 * Core data model for the Print-on-Top layout editor.
 *
 * Coordinate contract: all positions are stored in PDF points (1/72 inch),
 * using a TOP-LEFT origin. A field's (x, y) is the top-left corner of its
 * text em-box at `fontSize` — NOT the pdf-lib baseline. Converting to
 * pdf-lib's bottom-left baseline origin happens only at render time, see
 * `coordinates.ts`.
 */

export type LengthUnit = "pt" | "in" | "cm" | "mm";

export type TextAlignment = "left" | "center" | "right";

export type StandardFontFamily =
  | "Helvetica"
  | "Helvetica-Bold"
  | "Helvetica-Oblique"
  | "Helvetica-BoldOblique"
  | "Times-Roman"
  | "Times-Bold"
  | "Times-Italic"
  | "Times-BoldItalic"
  | "Courier"
  | "Courier-Bold"
  | "Courier-Oblique"
  | "Courier-BoldOblique";

export interface PageSize {
  /** Page width in PDF points. */
  widthPt: number;
  /** Page height in PDF points. */
  heightPt: number;
  /** Unit the user last edited dimensions in; purely a UI preference. */
  displayUnit: LengthUnit;
  orientation: "portrait" | "landscape";
}

export interface TextField {
  id: string;
  /** Machine identifier used to bind to real order data later, e.g. "customerName". */
  name: string;
  /** Human label shown in the editor UI. */
  label: string;
  /** Sample value used for on-canvas and PDF preview. */
  sampleValue: string;
  /** Top-left X in PDF points. */
  x: number;
  /** Top-left Y in PDF points (top-left origin). */
  y: number;
  fontSize: number;
  fontFamily: StandardFontFamily;
  alignment: TextAlignment;
  /** Optional max width in points; text is clipped/wrapped to this width if set. */
  maxWidth?: number;
  /** Optional max height in points, enabling line wrapping within the box. */
  maxHeight?: number;
  enabled: boolean;
}

export interface BackgroundImage {
  /** Data URL of the uploaded reference image. Never included in the rendered PDF. */
  dataUrl: string;
  /** Natural pixel dimensions of the uploaded image. */
  naturalWidthPx: number;
  naturalHeightPx: number;
  /**
   * How the image is displayed inside the page viewport when its aspect
   * ratio doesn't match the configured page size. "contain" (default)
   * keeps proportions and letterboxes; "stretch" fills the page exactly,
   * distorting the image, and should only be chosen deliberately.
   */
  fitMode: "contain" | "stretch";
}

export interface LayoutConfig {
  id: string;
  name: string;
  page: PageSize;
  background: BackgroundImage | null;
  fields: TextField[];
  updatedAt: string;
}

/** Values keyed by TextField.name, used to fill a layout for rendering. */
export type LayoutValues = Record<string, string>;
