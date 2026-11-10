import { FieldPosition, LayoutConfig } from "./types";

const STORAGE_KEY = "print-on-top:layouts";

interface LayoutIndex {
  [id: string]: LayoutConfig;
}

function readIndex(): LayoutIndex {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LayoutIndex) : {};
  } catch {
    return {};
  }
}

function writeIndex(index: LayoutIndex) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
}

/** Saves (or overwrites) a layout in browser-local storage. This is a stopgap
 * persistence layer: there is no backend database for print-on-top layouts
 * yet, so layouts live per-browser until a real persistence API exists. */
export function saveLayoutLocally(layout: LayoutConfig): void {
  const index = readIndex();
  index[layout.id] = layout;
  writeIndex(index);
}

export function deleteLayoutLocally(id: string): void {
  const index = readIndex();
  delete index[id];
  writeIndex(index);
}

export function listLocalLayouts(): LayoutConfig[] {
  return Object.values(readIndex()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function loadLocalLayout(id: string): LayoutConfig | null {
  return readIndex()[id] ?? null;
}

/** Serializes field positions to the JSON export format: `[{ text, x, y }]`. */
export function exportFieldPositionsToJson(positions: FieldPosition[]): string {
  return JSON.stringify(positions, null, 2);
}
