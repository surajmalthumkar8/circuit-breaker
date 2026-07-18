import { describe, it, expect } from "vitest";
import { screenSeverity } from "./severity";

const base = {
  daysPerWeek: 3,
  physicalSymptomsOnStopping: false,
  previousFailedAttempts: false,
};

describe("screenSeverity", () => {
  it("allows self-directed change for behavioural habits", () => {
    const result = screenSeverity({ ...base, habit: "screen_time" });
    expect(result.level).toBe("self_help");
    expect(result.requiresMedicalGuidance).toBe(false);
  });

  it("never coaches unsupervised alcohol cessation, even on light use", () => {
    const result = screenSeverity({ ...base, habit: "alcohol", daysPerWeek: 1 });
    expect(result.level).toBe("medical_supervision");
    expect(result.requiresMedicalGuidance).toBe(true);
    expect(result.reason.toLowerCase()).toContain("seizure");
  });

  it("escalates any habit to medical supervision when stopping caused physical symptoms", () => {
    const result = screenSeverity({
      ...base,
      habit: "vaping",
      physicalSymptomsOnStopping: true,
    });
    expect(result.requiresMedicalGuidance).toBe(true);
    expect(result.level).toBe("medical_supervision");
  });

  it("suggests extra support after failed attempts at a near-daily habit", () => {
    const result = screenSeverity({
      ...base,
      habit: "social_media",
      daysPerWeek: 7,
      previousFailedAttempts: true,
    });
    expect(result.level).toBe("seek_support");
    expect(result.requiresMedicalGuidance).toBe(false);
  });

  it("does not escalate to seek_support for infrequent habits with past attempts", () => {
    const result = screenSeverity({
      ...base,
      habit: "junk_food",
      daysPerWeek: 2,
      previousFailedAttempts: true,
    });
    expect(result.level).toBe("self_help");
  });

  it("always explains its reasoning to the user", () => {
    const result = screenSeverity({ ...base, habit: "gaming" });
    expect(result.reason.length).toBeGreaterThan(40);
  });
});
