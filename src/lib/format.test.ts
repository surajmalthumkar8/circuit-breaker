import { describe, it, expect } from "vitest";
import { absoluteTime, formatHour, formatMinutes, relativeTime } from "./format";

const REFERENCE = new Date("2026-07-18T12:00:00.000Z");

describe("relativeTime", () => {
  it("describes very recent moments as just now", () => {
    expect(relativeTime("2026-07-18T11:59:30.000Z", REFERENCE)).toBe("just now");
  });

  it("counts minutes, singular and plural", () => {
    expect(relativeTime("2026-07-18T11:59:00.000Z", REFERENCE)).toBe("1 minute ago");
    expect(relativeTime("2026-07-18T11:35:00.000Z", REFERENCE)).toBe("25 minutes ago");
  });

  it("counts hours once past sixty minutes", () => {
    expect(relativeTime("2026-07-18T09:00:00.000Z", REFERENCE)).toBe("3 hours ago");
    expect(relativeTime("2026-07-18T11:00:00.000Z", REFERENCE)).toBe("1 hour ago");
  });

  it("says yesterday rather than 1 day ago", () => {
    expect(relativeTime("2026-07-17T10:00:00.000Z", REFERENCE)).toBe("yesterday");
  });

  it("counts days up to a month, then switches to months", () => {
    expect(relativeTime("2026-07-08T12:00:00.000Z", REFERENCE)).toBe("10 days ago");
    expect(relativeTime("2026-05-18T12:00:00.000Z", REFERENCE)).toBe("2 months ago");
  });

  it("treats a future timestamp as just now instead of showing a negative age", () => {
    // A user's device clock can be ahead; "in -3 hours" would be a visible bug.
    expect(relativeTime("2026-07-18T15:00:00.000Z", REFERENCE)).toBe("just now");
  });

  it("is deterministic for a fixed reference, so server and client agree", () => {
    const first = relativeTime("2026-07-15T12:00:00.000Z", REFERENCE);
    const second = relativeTime("2026-07-15T12:00:00.000Z", REFERENCE);
    expect(first).toBe(second);
  });
});

describe("absoluteTime", () => {
  it("formats as weekday, day, month and zero-padded time", () => {
    expect(absoluteTime("2026-07-18T09:05:00.000Z")).toBe("Sat 18 Jul, 09:05");
  });

  it("pads midnight correctly rather than rendering 0:0", () => {
    expect(absoluteTime("2026-01-01T00:00:00.000Z")).toBe("Thu 1 Jan, 00:00");
  });

  it("uses a fixed vocabulary rather than the host locale, so renders match everywhere", () => {
    // Locale-dependent formatting differs between server and browser and breaks hydration.
    expect(absoluteTime("2026-12-25T23:59:00.000Z")).toBe("Fri 25 Dec, 23:59");
  });
});

describe("formatHour", () => {
  it("renders midnight and noon without a zero hour", () => {
    expect(formatHour(0)).toBe("12am");
    expect(formatHour(12)).toBe("12pm");
  });

  it("renders morning and evening hours", () => {
    expect(formatHour(9)).toBe("9am");
    expect(formatHour(23)).toBe("11pm");
    expect(formatHour(13)).toBe("1pm");
  });
});

describe("formatMinutes", () => {
  it("keeps sub-hour durations in minutes", () => {
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(0)).toBe("0m");
  });

  it("drops the minute part on a whole hour", () => {
    expect(formatMinutes(120)).toBe("2h");
  });

  it("shows hours and minutes together", () => {
    expect(formatMinutes(142)).toBe("2h 22m");
  });
});
