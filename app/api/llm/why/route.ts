import { NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/config";
import { generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import { buildWhyInFeedPrompt } from "@/lib/llm/prompts/whyInFeed";
import type { Regulation, UserProfile } from "@/lib/types";

const MODEL = "gemini-2.5-flash" as const;

interface RequestBody {
  regulation: Regulation;
  profile: UserProfile;
  matchedTopics: string[];
}

export async function POST(req: Request) {
  if (!isGeminiConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  const body = (await req.json()) as RequestBody;
  if (!body?.regulation || !body?.profile) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { systemInstruction, prompt } = buildWhyInFeedPrompt(
    body.regulation,
    body.profile,
    body.matchedTopics ?? [],
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
    return NextResponse.json({
      text: result.text,
      flags: result.flags,
      ok: result.ok,
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
