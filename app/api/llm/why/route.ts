import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import {
  isClerkConfigured,
  isGeminiConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import {
  getCachedWhyInFeed,
  upsertWhyInFeed,
} from "@/lib/db/cache";
import { getProfile } from "@/lib/db/profiles";
import { listStories } from "@/lib/db/stories";
import { buildWhyContextHash, WHY_PROMPT_VERSION } from "@/lib/embeddingInputs";
import { generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import { buildWhyInFeedPrompt } from "@/lib/llm/prompts/whyInFeed";
import { selectRelevantStories } from "@/lib/stories";
import type { Regulation, UserProfile } from "@/lib/types";

const MODEL = "gemini-2.5-flash" as const;

interface RequestBody {
  regulation: Regulation;
  profile: UserProfile;
  matchedTopics: string[];
}

async function contextFor(
  regulation: Regulation,
  fallbackProfile: UserProfile,
) {
  if (!isClerkConfigured || !isSupabaseConfigured) {
    return { userId: null, profile: fallbackProfile, stories: [] };
  }
  const userId = await currentUserId();
  if (!userId) {
    return { userId: null, profile: fallbackProfile, stories: [] };
  }
  try {
    const [serverProfile, stories] = await Promise.all([
      getProfile(userId),
      listStories(userId),
    ]);
    return {
      userId,
      profile: serverProfile ?? fallbackProfile,
      stories: selectRelevantStories(stories, regulation, 1),
    };
  } catch {
    return { userId, profile: fallbackProfile, stories: [] };
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as RequestBody;
  if (!body?.regulation || !body?.profile) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const matchedTopics = body.matchedTopics ?? [];
  const { userId, profile, stories } = await contextFor(
    body.regulation,
    body.profile,
  );
  const contextHash = buildWhyContextHash({
    profile,
    matchedTopics,
    stories,
    promptVersion: WHY_PROMPT_VERSION,
  });
  const citations = stories.map((story) => ({
    type: "story" as const,
    id: story.id,
    title: story.title,
  }));

  if (userId && isSupabaseConfigured) {
    try {
      const cached = await getCachedWhyInFeed(
        userId,
        body.regulation.id,
        contextHash,
      );
      if (cached) {
        return NextResponse.json({
          text: cached.text,
          flags: cached.flags,
          ok: true,
          cached: true,
          citations,
        });
      }
    } catch {
      // Cache misses/failures should not block generation.
    }
  }

  if (!isGeminiConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const { systemInstruction, prompt } = buildWhyInFeedPrompt(
    body.regulation,
    profile,
    matchedTopics,
    stories,
  );

  try {
    const result = await generateWithGate(
      (attempt) =>
        generate(prompt, {
          model: MODEL,
          systemInstruction,
          temperature: 0.6 + attempt * 0.1,
          maxOutputTokens: 300,
        }),
      { maxRetries: 1 },
    );
    if (userId && isSupabaseConfigured) {
      try {
        await upsertWhyInFeed({
          userId,
          documentId: body.regulation.id,
          text: result.text,
          flags: result.flags,
          contextHash,
          modelVersion: MODEL,
        });
      } catch {
        // Non-fatal. The caller still gets the fresh explanation.
      }
    }

    return NextResponse.json({
      text: result.text,
      flags: result.flags,
      ok: result.ok,
      cached: false,
      citations,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "generation_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
