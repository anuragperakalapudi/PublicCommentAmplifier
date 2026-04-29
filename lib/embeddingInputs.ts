import { createHash } from "crypto";
import type { Regulation, Story, UserProfile } from "./types";

export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;
export const WHY_PROMPT_VERSION = "why-in-feed:v2";

export function stableHash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function vectorToSql(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

export function parseVector(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const numbers = value.map(Number);
    return numbers.every(Number.isFinite) ? numbers : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!trimmed) return null;
  const numbers = trimmed.split(",").map((part) => Number(part.trim()));
  return numbers.every(Number.isFinite) ? numbers : null;
}

export function cosineSimilarity(a: number[], b: number[]): number | null {
  if (a.length === 0 || a.length !== b.length) return null;
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }
  if (aNorm === 0 || bNorm === 0) return null;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export function buildRegulationEmbeddingInput(reg: Regulation): string {
  return [
    `Title: ${reg.title}`,
    `Agency: ${reg.agencyName} (${reg.agencyId})`,
    `Document type: ${reg.documentType}`,
    `Topics: ${reg.topics.join(", ") || "(none)"}`,
    `Summary: ${reg.summary}`,
    reg.provisions?.length
      ? `Key provisions: ${reg.provisions.join(" ")}`
      : "",
    reg.excerpt ? `Excerpt: ${reg.excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildProfileEmbeddingInput(
  profile: UserProfile,
  stories: Story[],
): string {
  const storyText = stories
    .map((story) =>
      [
        `Story: ${story.title}`,
        `Story topics: ${story.tags.join(", ") || "(none)"}`,
        story.body,
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `Occupation: ${profile.occupation}`,
    `State: ${profile.state}`,
    `Additional states: ${(profile.additionalStates ?? []).join(", ") || "(none)"}`,
    `Age range: ${profile.ageRange}`,
    `Income: ${profile.income}`,
    `Household: ${profile.household}`,
    `Topics: ${profile.topics.join(", ") || "(none)"}`,
    profile.freeTextContext
      ? `Other context: ${profile.freeTextContext}`
      : "",
    storyText ? `Stories:\n${storyText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhyContextHash(input: {
  profile: UserProfile;
  matchedTopics: string[];
  stories: Story[];
  promptVersion?: string;
}): string {
  const payload = {
    promptVersion: input.promptVersion ?? WHY_PROMPT_VERSION,
    profile: {
      ageRange: input.profile.ageRange,
      occupation: input.profile.occupation,
      state: input.profile.state,
      income: input.profile.income,
      household: input.profile.household,
      topics: input.profile.topics,
      freeTextContext: input.profile.freeTextContext ?? "",
      additionalStates: input.profile.additionalStates ?? [],
    },
    matchedTopics: input.matchedTopics,
    stories: input.stories.map((story) => ({
      id: story.id,
      title: story.title,
      body: story.body,
      tags: story.tags,
      updatedAt: story.updatedAt,
    })),
  };
  return stableHash(JSON.stringify(payload));
}
