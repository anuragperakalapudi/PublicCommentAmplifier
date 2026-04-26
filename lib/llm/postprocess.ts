// Banned phrases / words that scream "AI-generated." Sourced from
// PROJECT_PLAN.md §7.2 and FRD §3.11.

const BANNED_PHRASES = [
  "delve",
  "tapestry",
  "ever-evolving",
  "navigating the complexities",
  "navigate the complexities",
  "unprecedented",
  "i'd like to",
  "i want to share",
  "it's important to note",
  "in today's world",
];

const BANNED_FILLER_WORDS = [
  // these flag at word boundary, not anywhere
  "robust",
  "comprehensive",
];

const FORBIDDEN_OPENERS = [
  /^furthermore[,\s]/i,
  /^moreover[,\s]/i,
  /^additionally[,\s]/i,
];

const MAX_SENTENCE_WORDS = 35;

export interface PostprocessResult {
  text: string;
  flags: string[];
  ok: boolean;
}

// Strips em dashes and replaces with periods, commas, or "and" depending on
// surrounding context. Conservative: defaults to comma when ambiguous.
export function stripEmDashes(s: string): string {
  return s
    // " — " → ", "
    .replace(/\s+[—–]\s+/g, ", ")
    // anything else with em or en dash → comma
    .replace(/[—–]/g, ",");
}

function checkBanned(s: string): string[] {
  const flags: string[] = [];
  const lower = s.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) flags.push(`phrase:${phrase}`);
  }
  for (const word of BANNED_FILLER_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(s)) flags.push(`word:${word}`);
  }
  // Forbidden sentence-starting moves anywhere in the text.
  for (const sent of s.split(/(?<=[.!?])\s+/)) {
    for (const re of FORBIDDEN_OPENERS) {
      if (re.test(sent)) flags.push(`opener:${sent.split(/\s/)[0]}`);
    }
    const wordCount = sent.trim().split(/\s+/).length;
    if (wordCount > MAX_SENTENCE_WORDS) {
      flags.push(`long-sentence:${wordCount}`);
    }
  }
  return flags;
}

// Single pass: strip em dashes, then scan for banned content.
export function postprocess(raw: string): PostprocessResult {
  const cleaned = stripEmDashes(raw).trim();
  const flags = checkBanned(cleaned);
  return {
    text: cleaned,
    flags,
    ok: flags.length === 0,
  };
}

interface RetryOpts {
  maxRetries?: number;
}

// Calls `gen()` up to maxRetries+1 times; returns the first clean output.
// If all attempts fail the postprocess gate, returns the last attempt with
// flags so the UI can mark it "verify before submitting."
export async function generateWithGate(
  gen: (attempt: number) => Promise<string>,
  opts: RetryOpts = {},
): Promise<PostprocessResult> {
  const max = opts.maxRetries ?? 2;
  let last: PostprocessResult | null = null;
  for (let attempt = 0; attempt <= max; attempt++) {
    const raw = await gen(attempt);
    last = postprocess(raw);
    if (last.ok) return last;
  }
  return last!;
}
