/**
 * Strip the punctuation habits that mark text as machine-written.
 *
 * The prompts already ask for plain human phrasing, but an instruction to a language model
 * is a probability, not a guarantee: em dashes in particular survive almost any amount of
 * asking. This runs over generated output on the way to the screen and makes the guarantee
 * deterministic, which is the same reasoning that keeps the risk score out of the model.
 *
 * It only removes signals it can identify from punctuation alone. Sentence rhythm, forced
 * triples, and stock vocabulary are handled in the prompt, because catching those with a
 * regular expression would mangle legitimate prose.
 *
 * The em dash becomes a comma rather than a full stop. Neither is right every time, but a
 * comma keeps the two halves joined, and joining two clauses that belong together reads
 * better than splitting one that does not stand alone.
 */

/** Emoji and pictographs. Excludes ranges that carry meaning in ordinary text. */
const EMOJI =
  /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu;

/** A dash used as prose punctuation, rather than between digits. */
const PROSE_DASH = /(?<![\d\s])\s*[—–]\s*(?!\d)|(?<=\s)[—–]\s+(?!\d)/gu;

export function humanise(text: string): string {
  /*
   * A string that is nothing but a dash is the interface's "no data" placeholder, not
   * prose. Rewriting it would turn an empty cell into a stray comma.
   */
  if (text.trim() === "—" || text.trim() === "–") return text;

  return text
    .replace(EMOJI, "")
    .replace(PROSE_DASH, ", ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    // Tidy up after the removals: doubled spaces, and spaces stranded before punctuation.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/,\s*,/g, ",");
}
