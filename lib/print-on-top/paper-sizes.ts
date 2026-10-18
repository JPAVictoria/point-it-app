import { inchesToPoints, mmToPoints } from "./units";

export interface PaperPreset {
  name: string;
  widthPt: number;
  heightPt: number;
}

/** Portrait dimensions for each preset; swap width/height for landscape. */
export const PAPER_PRESETS: PaperPreset[] = [
  { name: "Letter", widthPt: inchesToPoints(8.5), heightPt: inchesToPoints(11) },
  { name: "Legal", widthPt: inchesToPoints(8.5), heightPt: inchesToPoints(14) },
  { name: "A4", widthPt: mmToPoints(210), heightPt: mmToPoints(297) },
  { name: "A5", widthPt: mmToPoints(148), heightPt: mmToPoints(210) },
  { name: "Custom", widthPt: inchesToPoints(8.5), heightPt: inchesToPoints(11) },
];
