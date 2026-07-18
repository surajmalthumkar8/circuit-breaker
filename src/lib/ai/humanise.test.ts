import { describe, it, expect } from "vitest";
import { humanise } from "./humanise";

describe("humanise", () => {
  it("replaces a spaced em dash with a comma, which reads as written speech", () => {
    expect(humanise("Cravings rise and fall — usually within minutes.")).toBe(
      "Cravings rise and fall, usually within minutes.",
    );
  });

  it("replaces an unspaced em dash between words", () => {
    expect(humanise("a wave—not an order")).toBe("a wave, not an order");
  });

  it("replaces en dashes in prose the same way", () => {
    expect(humanise("You noticed it – that is the work.")).toBe(
      "You noticed it, that is the work.",
    );
  });

  it("leaves a numeric en dash range alone, since that is correct typography", () => {
    expect(humanise("Takes 3–5 minutes.")).toBe("Takes 3–5 minutes.");
  });

  it("leaves a lone dash placeholder untouched", () => {
    // The interface uses a bare em dash to mean "no data". Rewriting it would be a bug.
    expect(humanise("—")).toBe("—");
    expect(humanise("  —  ")).toBe("  —  ");
  });

  it("straightens curly quotes and apostrophes", () => {
    expect(humanise("“you’re fine”")).toBe('"you\'re fine"');
  });

  it("expands a single-character ellipsis", () => {
    expect(humanise("wait… breathe")).toBe("wait... breathe");
  });

  it("strips emoji, which never belong in this app's voice", () => {
    expect(humanise("Well done \u{1F389} keep going")).toBe("Well done keep going");
  });

  it("collapses the double space left behind by a removal", () => {
    expect(humanise("one  two")).toBe("one two");
  });

  it("does not introduce a space before punctuation", () => {
    expect(humanise("Nice \u{1F44D}.")).toBe("Nice.");
  });

  it("leaves ordinary prose completely unchanged", () => {
    const clean = "You noticed the urge and named it. That is the whole skill.";
    expect(humanise(clean)).toBe(clean);
  });

  it("handles an empty string without throwing", () => {
    expect(humanise("")).toBe("");
  });

  it("is idempotent, so running it twice changes nothing further", () => {
    const once = humanise("a wave—not an order \u{1F30A} — let it pass");
    expect(humanise(once)).toBe(once);
  });
});
