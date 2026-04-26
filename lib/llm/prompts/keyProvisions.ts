import type { Regulation } from "@/lib/types";

const SYSTEM = `You extract the key provisions from a federal proposed rule
and list them as plain-language bullets. The bullets help a non-expert see
which parts of the rule actually change something.

Output 4-7 bullets. Each bullet is one sentence, max 25 words. Concrete,
specific, written in active voice. Use the rule's own dollar figures, dates,
and program names when present.

Hard rules:
- No em dashes. No "delve," "tapestry," "navigate complexities,"
  "comprehensive," "robust."
- One bullet per line, prefixed with "- ".
- No header, no preamble, no commentary. Just the bullets.`;

export function buildKeyProvisionsPrompt(reg: Regulation): {
  systemInstruction: string;
  prompt: string;
} {
  const prompt = [
    `Title: ${reg.title}`,
    `Agency: ${reg.agencyName}`,
    "",
    `Rule abstract:`,
    reg.summary,
    reg.excerpt ? `\nOfficial excerpt:\n${reg.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { systemInstruction: SYSTEM, prompt };
}

// Parses the bullet output into a string array. Tolerant of "-", "*", "•"
// and leading/trailing whitespace.
export function parseProvisions(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s]*[-*•]\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 8);
}
