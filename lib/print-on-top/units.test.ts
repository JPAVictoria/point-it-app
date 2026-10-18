import { describe, expect, it } from "vitest";
import {
  cmToPoints,
  fromPoints,
  inchesToPoints,
  mmToPoints,
  pointsToCm,
  pointsToInches,
  pointsToMm,
  toPoints,
} from "./units";

describe("units", () => {
  it("converts inches to points using 72pt/inch", () => {
    expect(inchesToPoints(1)).toBe(72);
    expect(inchesToPoints(8.25)).toBeCloseTo(594, 5);
  });

  it("round-trips inches through points", () => {
    expect(pointsToInches(inchesToPoints(6.875))).toBeCloseTo(6.875, 10);
  });

  it("matches the spec example: 8.25 x 6.875 in -> 594 x 495 pt", () => {
    expect(inchesToPoints(8.25)).toBeCloseTo(594, 5);
    expect(inchesToPoints(6.875)).toBeCloseTo(495, 5);
  });

  it("round-trips millimeters and centimeters through points", () => {
    expect(pointsToMm(mmToPoints(210))).toBeCloseTo(210, 8);
    expect(pointsToCm(cmToPoints(29.7))).toBeCloseTo(29.7, 8);
  });

  it("toPoints/fromPoints agree with the direct conversion helpers for every unit", () => {
    expect(toPoints(1, "in")).toBe(inchesToPoints(1));
    expect(toPoints(10, "mm")).toBeCloseTo(mmToPoints(10), 10);
    expect(toPoints(1, "cm")).toBeCloseTo(cmToPoints(1), 10);
    expect(toPoints(72, "pt")).toBe(72);

    expect(fromPoints(72, "in")).toBe(pointsToInches(72));
    expect(fromPoints(72, "mm")).toBeCloseTo(pointsToMm(72), 10);
    expect(fromPoints(72, "cm")).toBeCloseTo(pointsToCm(72), 10);
    expect(fromPoints(72, "pt")).toBe(72);
  });
});
