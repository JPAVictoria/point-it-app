import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time";

const NOW = new Date("2026-11-11T12:00:00Z").getTime();

describe("formatRelativeTime", () => {
  it("uses short relative labels for recent times", () => {
    expect(formatRelativeTime("2026-11-11T11:59:30Z", NOW)).toBe("just now");
    expect(formatRelativeTime("2026-11-11T11:55:00Z", NOW)).toBe("5m ago");
    expect(formatRelativeTime("2026-11-11T09:00:00Z", NOW)).toBe("3h ago");
    expect(formatRelativeTime("2026-11-09T12:00:00Z", NOW)).toBe("2d ago");
  });

  it("falls back to a date after a week", () => {
    expect(formatRelativeTime("2026-10-03T12:00:00Z", NOW)).toBe("Oct 3");
    expect(formatRelativeTime("2025-10-03T12:00:00Z", NOW)).toBe("Oct 3, 2025");
  });
});
