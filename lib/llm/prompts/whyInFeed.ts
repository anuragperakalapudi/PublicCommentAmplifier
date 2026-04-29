import type { Regulation, Story, UserProfile } from "@/lib/types";

const SYSTEM = `You explain to a user why a federal rule landed high in
their personalized feed. Be specific. Be brief.

Output: 2-3 short sentences. Cite the user's actual profile fields and the
specific feature of the rule that matched. Do not be generic. Do not say
"based on your interests"; say what the interest is.
If a relevant user story is provided, reference only details supported by that
story and connect them to the rule in plain language.

Hard rules:
- No em dashes. No filler. No "It's important to note."
- Speak directly to the user (second person).
- No quotation marks around the output.`;

export function buildWhyInFeedPrompt(
  reg: Regulation,
  profile: UserProfile,
  matchedTopics: string[],
  stories: Story[] = [],
): { systemInstruction: string; prompt: string } {
  const profileLines = [
    `- Occupation: ${profile.occupation}`,
    `- State: ${profile.state}`,
    `- Household: ${profile.household}`,
    `- Topics they selected: ${profile.topics.join(", ")}`,
  ];
  if (profile.additionalStates && profile.additionalStates.length > 0) {
    profileLines.push(
      `- Additional states they care about: ${profile.additionalStates.join(", ")}`,
    );
  }
  if (profile.freeTextContext) {
    profileLines.push(`- Other context they shared: "${profile.freeTextContext}"`);
  }

  const storyLines = stories.length
    ? [
        "",
        "RELEVANT USER STORY",
        `Title: ${stories[0].title}`,
        `Topics: ${stories[0].tags.join(", ") || "(none)"}`,
        `Story text: ${stories[0].body}`,
      ]
    : [];

  const prompt = [
    `USER PROFILE`,
    ...profileLines,
    ...storyLines,
    "",
    `RULE`,
    `Title: ${reg.title}`,
    `Agency: ${reg.agencyName}`,
    `Topics inferred for this rule: ${reg.topics.join(", ") || "(none)"}`,
    `Topics that matched the user: ${matchedTopics.join(", ") || "(none)"}`,
    `Abstract: ${reg.summary}`,
  ].join("\n");
  return { systemInstruction: SYSTEM, prompt };
}
