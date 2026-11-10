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
  /**
   * Object path of the uploaded reference image in the Supabase Storage
   * bucket (`{layoutId}/{uuid}.{ext}`). Never included in the rendered PDF.
   * The editor displays it through a signed URL or a local object URL.
   */
  storagePath: string;
  /** Path of the ~600 px JPEG copy shown on the Compilation page. */
  thumbnailPath: string;
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
  /**
   * Manually adjusted placement (move/resize in the editor), in points with
   * a top-left origin. When set it overrides `fitMode`; it may extend past
   * the page edges, in which case the image is clipped to the page.
   */
  frame?: ImageFrame;
}

export interface ImageFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutConfig {
  id: string;
  name: string;
  /** Free-text name typed by whoever created the layout; not verified (the app has no logins). */
  authorName: string | null;
  page: PageSize;
  background: BackgroundImage | null;
  fields: TextField[];
  /** Incremented on every save; autosave sends it back to detect edits made elsewhere. */
  version: number;
  updatedAt: string;
}

/** The parts of a layout the editor saves. */
export type LayoutContent = Pick<LayoutConfig, "name" | "page" | "fields" | "background">;

/** A layout as listed on the Compilation page. */
export interface LayoutSummary extends LayoutConfig {
  createdAt: string;
  /** Short-lived signed URL of the thumbnail, or null when the layout has no image. */
  thumbnailUrl: string | null;
}

/** Values keyed by TextField.name, used to fill a layout for rendering. */
export type LayoutValues = Record<string, string>;

/** One entry of the JSON export: a field's text and its pdf-lib drawText position. */
export interface FieldPosition {
  text: string;
  x: number;
  y: number;
}
