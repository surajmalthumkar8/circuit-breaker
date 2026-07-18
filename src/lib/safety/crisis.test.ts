import { describe, it, expect } from "vitest";
import { checkForCrisis, CRISIS_RESOURCES } from "./crisis";

describe("checkForCrisis", () => {
  it("passes ordinary habit-related text through unblocked", () => {
    const result = checkForCrisis("I really want to open Instagram right now");
    expect(result.severity).toBe("none");
    expect(result.blocked).toBe(false);
  });

  it("treats empty and whitespace-only input as safe", () => {
    expect(checkForCrisis("").blocked).toBe(false);
    expect(checkForCrisis("   \n  ").blocked).toBe(false);
  });

  it("detects explicit suicidal statements and blocks coaching", () => {
    const result = checkForCrisis("honestly I want to die");
    expect(result.severity).toBe("crisis");
    expect(result.blocked).toBe(true);
    expect(result.matched).toBe("want to die");
  });

  it("detects self-harm phrasing", () => {
    expect(checkForCrisis("I keep thinking about hurting myself").severity).toBe("crisis");
  });

  it("matches regardless of casing and surrounding punctuation", () => {
    const result = checkForCrisis("I'm SUICIDAL!!! ...please help");
    expect(result.severity).toBe("crisis");
  });

  it("prioritises medical emergencies over general crisis wording", () => {
    const result = checkForCrisis("I'm shaking uncontrollably and I want to die");
    expect(result.severity).toBe("medical_emergency");
    expect(result.blocked).toBe(true);
  });

  it("detects withdrawal seizure descriptions as a medical emergency", () => {
    expect(checkForCrisis("I think I'm having a seizure").severity).toBe("medical_emergency");
  });

  it("does not fire on benign words that merely contain a keyword substring", () => {
    // "overdose" must not be triggered by unrelated everyday phrasing.
    const result = checkForCrisis("I overdid it on screen time yesterday");
    expect(result.severity).toBe("none");
  });

  it("returns an actionable message whenever it blocks", () => {
    const result = checkForCrisis("suicide");
    expect(result.blocked).toBe(true);
    expect(result.message.length).toBeGreaterThan(40);
  });
});

describe("CRISIS_RESOURCES", () => {
  it("ships at least one resource for several regions", () => {
    const regions = new Set(CRISIS_RESOURCES.map((r) => r.region));
    expect(regions.size).toBeGreaterThanOrEqual(4);
  });

  it("gives every resource a name, a contact method and a description", () => {
    for (const resource of CRISIS_RESOURCES) {
      expect(resource.name.length).toBeGreaterThan(0);
      expect(resource.contact.length).toBeGreaterThan(0);
      expect(resource.detail.length).toBeGreaterThan(0);
    }
  });

  it("uses https for every link, since these pages handle sensitive traffic", () => {
    for (const resource of CRISIS_RESOURCES) {
      if (resource.href) expect(resource.href.startsWith("https://")).toBe(true);
    }
  });

  it("includes the US 988 line and the international directory", () => {
    const contacts = CRISIS_RESOURCES.map((r) => r.contact).join(" ");
    expect(contacts).toContain("988");
    expect(CRISIS_RESOURCES.some((r) => r.region === "International")).toBe(true);
  });
});
