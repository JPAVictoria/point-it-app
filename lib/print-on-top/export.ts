import { FieldPosition } from "./types";

/** Serializes field positions to the JSON export format: `[{ text, x, y }]`. */
export function exportFieldPositionsToJson(positions: FieldPosition[]): string {
  return JSON.stringify(positions, null, 2);
}
