import { describe, it, expect } from "vitest";
import { summariseStreak } from "./streak";
import type { UrgeEvent, UrgeOutcome } from "@/lib/domain/types";
import { assessRisk } from "@/lib/risk/vulnerability";

const NOW = new Date("2026-03-01T12:00:00Z");
const STARTED = new Date("2026-01-01T12:00:00Z");

function urge(at: string, outcome: UrgeOutcome): UrgeEvent {
  return {
    id: `urge-${at}-${outcome}`,
    at,
    intent: "open Instagram",
    intensity: 6,
    trigger: "boredom",
    mood: "ok",
    risk: assessRisk({
      intensity: 6,
      trigger: "boredom",
      at: new Date(at),
      history: [],
      checkIns: [],
      streakDays: 5,
    }),
    outcome,
  };
}

describe("summariseStreak", () => {
  it("counts from the start date when no lapse has ever happened", () => {
    const summary = summariseStreak([urge("2026-02-20T10:00:00Z", "rode_it_out")], NOW, STARTED);
    expect(summary.currentDays).toBe(59);
    expect(summary.lapses).toBe(0);
  });

  it("counts from the most recent lapse, not the first", () => {
    const summary = summariseStreak(
      [urge("2026-01-10T12:00:00Z", "lapsed"), urge("2026-02-24T12:00:00Z", "lapsed")],
      NOW,
      STARTED,
    );
    // 24 Feb → 1 Mar is 5 days (2026 is not a leap year).
    expect(summary.currentDays).toBe(5);
    expect(summary.lapses).toBe(2);
  });

  it("keeps the best run after a lapse, because a lapse does not erase progress", () => {
    const summary = summariseStreak([urge("2026-02-24T12:00:00Z", "lapsed")], NOW, STARTED);
    expect(summary.currentDays).toBe(5);
    // The 54-day run before the lapse is retained.
    expect(summary.bestDays).toBeGreaterThanOrEqual(54);
  });

  it("never frames a lapse as failure in its message", () => {
    const summary = summariseStreak([urge("2026-03-01T09:00:00Z", "lapsed")], NOW, STARTED);
    const message = summary.message.toLowerCase();
    expect(message).not.toContain("failed");
    expect(message).not.toContain("lost");
    expect(message).toContain("data");
  });

  it("computes the resilience rate from resolved urges only", () => {
    const summary = summariseStreak(
      [
        urge("2026-02-01T12:00:00Z", "rode_it_out"),
        urge("2026-02-02T12:00:00Z", "rode_it_out"),
        urge("2026-02-03T12:00:00Z", "rode_it_out"),
        urge("2026-02-04T12:00:00Z", "lapsed"),
        urge("2026-02-05T12:00:00Z", "pending"),
      ],
      NOW,
      STARTED,
    );
    expect(summary.urgesRidden).toBe(3);
    // Pending urges are excluded from the denominator.
    expect(summary.resilienceRate).toBeCloseTo(0.75, 5);
  });

  it("handles an empty log without dividing by zero", () => {
    const summary = summariseStreak([], NOW, STARTED);
    expect(summary.resilienceRate).toBe(0);
    expect(summary.urgesRidden).toBe(0);
    expect(Number.isFinite(summary.currentDays)).toBe(true);
  });

  it("never returns a negative day count when a lapse is timestamped in the future", () => {
    const summary = summariseStreak([urge("2026-06-01T12:00:00Z", "lapsed")], NOW, STARTED);
    expect(summary.currentDays).toBeGreaterThanOrEqual(0);
  });
});
