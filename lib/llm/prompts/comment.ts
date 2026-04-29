import type { Regulation, Story, UserProfile } from "@/lib/types";

export type CommentVariant = "balanced" | "shorter" | "personal";

const VARIANT_DIRECTIVES: Record<CommentVariant, string> = {
  balanced: `Structure: lead with the policy concern. Open with one sentence
naming the rule and the user's stake in it. Then 2-3 sentences of relevant
lived experience. Close with a concrete suggestion or question.`,
  shorter: `Structure: lead with a question to the agency. Open with the
specific question this rule raises for the user. Then 2-3 short sentences
grounding the question in the user's situation. Total length: 200-280
words.`,
  personal: `Structure: lead with the personal story. Open with a vivid,
specific moment from the user's daily life. Then connect that experience to
the rule. Close with what the agency should change. Total length: 350-450
words.`,
};

const SYSTEM_INSTRUCTION = `You help a real American write a public comment
on a federal proposed rule. They will paste this comment into regulations.gov
and submit it under their name. Their identity must be accurate; never
invent details about them.

Voice rules:
- Write at a 9th-grade reading level.
- Vary sentence length aggressively. Mix 4-word sentences with 25-word ones.
- Use specific nouns, not abstract ones. "$40 copay," not "financial burden."
- One concrete fact per paragraph minimum.
- First-person voice anchored in the user's actual occupation, location, household.
- No throat-clearing openers.

Forbidden:
- Em dashes. Use periods, commas, or "and" instead.
- The phrases: "I'd like to," "I want to share," "It's important to note,"
  "In today's world."
- The words: delve, tapestry, navigate (figurative), comprehensive, robust,
  ever-evolving, unprecedented, leverage (verb), foster (verb).
- Sentences starting with Furthermore, Moreover, or Additionally.
- Any sentence over 35 words.
- Stating support or opposition with no reason grounded in the user's life.
- Inventing facts. Use only what's in the USER PROFILE and RULE sections.
- If USER STORIES are provided, use them only when relevant. Do not invent
  experiences beyond the story text.

If the user has thin context, write a thinner comment. Don't pad.`;

export function buildCommentPrompt(
  reg: Regulation,
  profile: UserProfile,
  variant: CommentVariant,
  stories: Story[] = [],
): { systemInstruction: string; prompt: string } {
  const directive = VARIANT_DIRECTIVES[variant];

  const profileLines = [
    `- Age range: ${profile.ageRange}`,
    `- Occupation: ${profile.occupation}`,
    `- State: ${profile.state}`,
    `- Income: ${profile.income}`,
    `- Household: ${profile.household}`,
    `- Topics they care about: ${profile.topics.join(", ")}`,
  ];
  if (profile.additionalStates && profile.additionalStates.length > 0) {
    profileLines.push(
      `- Additional states they care about: ${profile.additionalStates.join(", ")}`,
    );
  }
  if (profile.freeTextContext) {
    profileLines.push(`- Other context they shared: "${profile.freeTextContext}"`);
  }
  const profileBlock = profileLines.join("\n");

  const storyBlock = stories.length
    ? stories
        .map((story, i) =>
          [
            `Story ${i + 1}: ${story.title}`,
            `Topics: ${story.tags.join(", ") || "(none)"}`,
            story.body,
          ].join("\n"),
        )
        .join("\n\n")
    : "";

  const ruleBlock = [
    `Title: ${reg.title}`,
    `Agency: ${reg.agencyName} (${reg.agencyId})`,
    `Document type: ${reg.documentType}`,
    `Document ID: ${reg.id}`,
    `Comment closes: ${reg.commentEndDate}`,
    "",
    `Rule abstract:`,
    reg.summary,
    reg.provisions && reg.provisions.length > 0
      ? `\nKey provisions:\n${reg.provisions.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
      : "",
    reg.excerpt ? `\nOfficial excerpt:\n${reg.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = [
    `Draft a public comment for the user below.`,
    "",
    directive,
    "",
    `USER PROFILE`,
    profileBlock,
    "",
    storyBlock ? `USER STORIES` : "",
    storyBlock,
    storyBlock
      ? "Use story details only when they apply to this rule. Paraphrase rather than quote at length."
      : "",
    storyBlock ? "" : "",
    `RULE`,
    ruleBlock,
    "",
    `Output only the comment text. Do not include a salutation header,
"Dear ...", a signature line, or commentary about the comment itself. Do
not include section headers like "STORY:" or "ASK:". Plain prose only.`,
  ].join("\n");

  return { systemInstruction: SYSTEM_INSTRUCTION, prompt };
}
