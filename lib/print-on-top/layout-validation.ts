import {
  BackgroundImage,
  ImageFrame,
  LayoutContent,
  LengthUnit,
  PageSize,
  StandardFontFamily,
  TextAlignment,
  TextField,
} from "./types";

/**
 * Validates data arriving at the server from the browser. Server Functions
 * are reachable by direct POST, so nothing from the client is trusted: every
 * value is checked for type and range, and unknown keys are dropped.
 */

export class LayoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayoutValidationError";
  }
}

export const MAX_NAME_LENGTH = 80;
export const MAX_AUTHOR_NAME_LENGTH = 60;
export const MAX_FIELDS = 300;
const MAX_TEXT_LENGTH = 2000;
/** Generous upper bound for any length in points (~70 in). */
const MAX_PT = 5000;

const UNITS: LengthUnit[] = ["pt", "in", "cm", "mm"];
const ALIGNMENTS: TextAlignment[] = ["left", "center", "right"];
const FONTS: StandardFontFamily[] = [
  "Helvetica",
  "Helvetica-Bold",
  "Helvetica-Oblique",
  "Helvetica-BoldOblique",
  "Times-Roman",
  "Times-Bold",
  "Times-Italic",
  "Times-BoldItalic",
  "Courier",
  "Courier-Bold",
  "Courier-Oblique",
  "Courier-BoldOblique",
];

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_RE = new RegExp(`^${UUID}$`, "i");

function fail(path: string, problem: string): never {
  throw new LayoutValidationError(`${path} ${problem}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "must be an object");
  return value as Record<string, unknown>;
}

function num(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a number");
  if (value < min || value > max) fail(path, `must be between ${min} and ${max}`);
  return value;
}

function str(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== "string") fail(path, "must be a string");
  if (value.length > maxLength) fail(path, `must be at most ${maxLength} characters`);
  return value;
}

function oneOf<T extends string>(value: unknown, path: string, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) fail(path, `must be one of ${allowed.join(", ")}`);
  return value as T;
}

function optionalNum(value: unknown, path: string, min: number, max: number): number | undefined {
  return value === undefined || value === null ? undefined : num(value, path, min, max);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function parseLayoutId(value: unknown): string {
  if (!isUuid(value)) throw new LayoutValidationError("Layout id is invalid.");
  return value;
}

export function parseLayoutName(value: unknown): string {
  const name = str(value, "Layout name", MAX_NAME_LENGTH).trim();
  if (!name) fail("Layout name", "can't be empty");
  return name;
}

/** Trims, and turns blank into null. */
export function parseAuthorName(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const name = str(value, "Author name", MAX_AUTHOR_NAME_LENGTH).trim();
  return name || null;
}

export function parsePage(value: unknown): PageSize {
  const v = record(value, "page");
  return {
    widthPt: num(v.widthPt, "page.widthPt", 1, MAX_PT),
    heightPt: num(v.heightPt, "page.heightPt", 1, MAX_PT),
    displayUnit: oneOf(v.displayUnit, "page.displayUnit", UNITS),
    orientation: oneOf(v.orientation, "page.orientation", ["portrait", "landscape"] as const),
  };
}

function parseField(value: unknown, index: number): TextField {
  const path = `fields[${index}]`;
  const v = record(value, path);
  if (typeof v.enabled !== "boolean") fail(`${path}.enabled`, "must be true or false");
  return {
    id: str(v.id, `${path}.id`, 100),
    name: str(v.name, `${path}.name`, 200),
    label: str(v.label, `${path}.label`, 200),
    sampleValue: str(v.sampleValue, `${path}.sampleValue`, MAX_TEXT_LENGTH),
    x: num(v.x, `${path}.x`, -MAX_PT, MAX_PT),
    y: num(v.y, `${path}.y`, -MAX_PT, MAX_PT),
    fontSize: num(v.fontSize, `${path}.fontSize`, 1, 500),
    fontFamily: oneOf(v.fontFamily, `${path}.fontFamily`, FONTS),
    alignment: oneOf(v.alignment, `${path}.alignment`, ALIGNMENTS),
    maxWidth: optionalNum(v.maxWidth, `${path}.maxWidth`, 0, MAX_PT),
    maxHeight: optionalNum(v.maxHeight, `${path}.maxHeight`, 0, MAX_PT),
    enabled: v.enabled,
  };
}

export function parseFields(value: unknown): TextField[] {
  if (!Array.isArray(value)) fail("fields", "must be a list");
  if (value.length > MAX_FIELDS) fail("fields", `can have at most ${MAX_FIELDS} entries`);
  return value.map(parseField);
}

function parseFrame(value: unknown): ImageFrame {
  const v = record(value, "background.frame");
  return {
    x: num(v.x, "background.frame.x", -MAX_PT, MAX_PT),
    y: num(v.y, "background.frame.y", -MAX_PT, MAX_PT),
    width: num(v.width, "background.frame.width", 1, MAX_PT * 2),
    height: num(v.height, "background.frame.height", 1, MAX_PT * 2),
  };
}

/** Object paths a layout may reference: only files inside its own folder, with the names the server issues. */
export function imagePathPattern(layoutId: string): RegExp {
  return new RegExp(`^${layoutId}/${UUID}\\.(png|jpg)$`, "i");
}

export function thumbnailPathPattern(layoutId: string): RegExp {
  return new RegExp(`^${layoutId}/${UUID}\\.thumb\\.jpg$`, "i");
}

export function parseBackground(value: unknown, layoutId: string): BackgroundImage | null {
  if (value === null || value === undefined) return null;
  const v = record(value, "background");
  const storagePath = str(v.storagePath, "background.storagePath", 200);
  const thumbnailPath = str(v.thumbnailPath, "background.thumbnailPath", 200);
  if (!imagePathPattern(layoutId).test(storagePath)) fail("background.storagePath", "is not an image of this layout");
  if (!thumbnailPathPattern(layoutId).test(thumbnailPath)) fail("background.thumbnailPath", "is not a thumbnail of this layout");
  return {
    storagePath,
    thumbnailPath,
    naturalWidthPx: num(v.naturalWidthPx, "background.naturalWidthPx", 1, 100000),
    naturalHeightPx: num(v.naturalHeightPx, "background.naturalHeightPx", 1, 100000),
    fitMode: oneOf(v.fitMode, "background.fitMode", ["contain", "stretch"] as const),
    frame: v.frame === undefined || v.frame === null ? undefined : parseFrame(v.frame),
  };
}

export function parseLayoutContent(value: unknown, layoutId: string): LayoutContent {
  const v = record(value, "layout");
  return {
    name: parseLayoutName(v.name),
    page: parsePage(v.page),
    fields: parseFields(v.fields),
    background: parseBackground(v.background, layoutId),
  };
}
