import type { Regulation } from "@/lib/types";

const SYSTEM = `You explain federal proposed rules in one sentence to a busy
American who has not read the rule. The sentence appears as a card subtitle
in their feed. It must read as plain English written by a person.

Hard rules:
- Exactly one sentence. 18-30 words.
- 9th grade reading level.
- Lead with what changes, not "this rule proposes."
- No em dashes. No "delve," "tapestry," "ever-evolving," "comprehensive,"
  "robust," "navigating the complexities."
- No throat-clearing openers. No "It's important to note." No "In today's world."
- Use the rule's own dollar figures, dates, and program names when present.`;

export function buildShortSummaryPrompt(reg: Regulation): {
  systemInstruction: string;
  prompt: string;
} {
  const prompt = [
    `Title: ${reg.title}`,
    `Agency: ${reg.agencyName}`,
    `Document type: ${reg.documentType}`,
    `Closes: ${reg.commentEndDate}`,
    "",
    `Abstract:`,
    reg.summary,
    "",
    `Output only the one-sentence summary. No quotes, no commentary.`,
  ].join("\n");
  return { systemInstruction: SYSTEM, prompt };
}
