import { LengthUnit } from "./types";

export const POINTS_PER_INCH = 72;
const MM_PER_INCH = 25.4;
const CM_PER_INCH = 2.54;

export function inchesToPoints(inches: number): number {
  return inches * POINTS_PER_INCH;
}

export function pointsToInches(points: number): number {
  return points / POINTS_PER_INCH;
}

export function mmToPoints(mm: number): number {
  return (mm / MM_PER_INCH) * POINTS_PER_INCH;
}

export function pointsToMm(points: number): number {
  return (points / POINTS_PER_INCH) * MM_PER_INCH;
}

export function cmToPoints(cm: number): number {
  return (cm / CM_PER_INCH) * POINTS_PER_INCH;
}

export function pointsToCm(points: number): number {
  return (points / POINTS_PER_INCH) * CM_PER_INCH;
}

/** Converts a value expressed in `unit` into PDF points. */
export function toPoints(value: number, unit: LengthUnit): number {
  switch (unit) {
    case "pt":
      return value;
    case "in":
      return inchesToPoints(value);
    case "cm":
      return cmToPoints(value);
    case "mm":
      return mmToPoints(value);
  }
}

/** Converts a value in PDF points into `unit`. */
export function fromPoints(points: number, unit: LengthUnit): number {
  switch (unit) {
    case "pt":
      return points;
    case "in":
      return pointsToInches(points);
    case "cm":
      return pointsToCm(points);
    case "mm":
      return pointsToMm(points);
  }
}

/** Rounds to a sane display precision for a given unit (points: whole, others: 0.01). */
export function roundForUnit(value: number, unit: LengthUnit): number {
  const precision = unit === "pt" ? 1 : 100;
  return Math.round(value * precision) / precision;
}
