import { LayoutConfig, PageSize, TextField } from "./types";
import { inchesToPoints } from "./units";

function id(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultPageSize(): PageSize {
  return {
    widthPt: inchesToPoints(8.5),
    heightPt: inchesToPoints(11),
    displayUnit: "in",
    orientation: "portrait",
  };
}

export function createEmptyLayout(name = "Untitled Layout"): LayoutConfig {
  return {
    id: id(),
    name,
    page: createDefaultPageSize(),
    background: null,
    fields: [],
    updatedAt: new Date().toISOString(),
  };
}

let fieldCounter = 0;

export function createTextField(x: number, y: number): TextField {
  fieldCounter += 1;
  return {
    id: id(),
    name: `field${fieldCounter}`,
    label: `Field ${fieldCounter}`,
    sampleValue: "Sample text",
    x,
    y,
    fontSize: 12,
    fontFamily: "Helvetica",
    alignment: "left",
    enabled: true,
  };
}
