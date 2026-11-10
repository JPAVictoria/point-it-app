import { inchesToPoints, mmToPoints } from "./units";

export type PaperPresetGroup = "Standard" | "Oboda forms";

export interface PaperPreset {
  name: string;
  group: PaperPresetGroup;
  widthPt: number;
  heightPt: number;
}

/**
 * Standard sizes are stored portrait; applying one keeps the current
 * orientation. Oboda form sizes are stored exactly as each template in
 * oboda-app passes them to `pdfDoc.addPage`, orientation included.
 */
export const PAPER_PRESETS: PaperPreset[] = [
  { name: "Letter", group: "Standard", widthPt: inchesToPoints(8.5), heightPt: inchesToPoints(11) },
  { name: "Legal", group: "Standard", widthPt: inchesToPoints(8.5), heightPt: inchesToPoints(14) },
  { name: "Long / Folio", group: "Standard", widthPt: inchesToPoints(8.5), heightPt: inchesToPoints(13) },
  { name: "Half Letter", group: "Standard", widthPt: inchesToPoints(5.5), heightPt: inchesToPoints(8.5) },
  { name: "A4", group: "Standard", widthPt: mmToPoints(210), heightPt: mmToPoints(297) },
  { name: "A5", group: "Standard", widthPt: mmToPoints(148), heightPt: mmToPoints(210) },

  { name: "IPCC Sales Invoice", group: "Oboda forms", widthPt: 733, heightPt: 594 },
  { name: "IPCC Sales Invoice (portrait)", group: "Oboda forms", widthPt: 612, heightPt: 747 },
  { name: "IPCC Delivery Receipt", group: "Oboda forms", widthPt: 594, heightPt: 495 },
  { name: "Koken Delivery Receipt", group: "Oboda forms", widthPt: 576, heightPt: 648 },
  { name: "Insulite Invoice / Packing List / DR", group: "Oboda forms", widthPt: 612, heightPt: 468 },
  { name: "Guaranfood Sales Invoice", group: "Oboda forms", widthPt: 572.6, heightPt: 385.5 },
  { name: "Guaranfood VAT DR", group: "Oboda forms", widthPt: 612, heightPt: 396 },
  { name: "Guaranfood Non-VAT DR", group: "Oboda forms", widthPt: 566.36, heightPt: 456.66 },
  { name: "Just & Jest Delivery Receipt", group: "Oboda forms", widthPt: 510.24, heightPt: 425.2 },
  { name: "Just & Jest Sales Invoice", group: "Oboda forms", widthPt: 374.17, heightPt: 566.93 },
  { name: "VNJ / ECL Sales Invoice", group: "Oboda forms", widthPt: 642, heightPt: 841.89 },
  { name: "Foodchoice DR (internal)", group: "Oboda forms", widthPt: 581, heightPt: 737 },
  { name: "SPMC (horizontal)", group: "Oboda forms", widthPt: 531, heightPt: 443.88 },
  { name: "CMT Voucher", group: "Oboda forms", widthPt: 595.28, heightPt: 651.97 },
];

const MATCH_TOLERANCE_PT = 0.5;

function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= MATCH_TOLERANCE_PT;
}

/** Finds the preset matching the given dimensions in either orientation. Exact-orientation matches win. */
export function findPreset(widthPt: number, heightPt: number): PaperPreset | null {
  const exact = PAPER_PRESETS.find((p) => near(p.widthPt, widthPt) && near(p.heightPt, heightPt));
  if (exact) return exact;
  return PAPER_PRESETS.find((p) => near(p.widthPt, heightPt) && near(p.heightPt, widthPt)) ?? null;
}
