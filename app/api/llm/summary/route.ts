import { NextResponse } from "next/server";
import {
  isGeminiConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import { generate } from "@/lib/llm/client";
import { generateWithGate } from "@/lib/llm/postprocess";
import { buildLongSummaryPrompt } from "@/lib/llm/prompts/longSummary";
import {
  buildKeyProvisionsPrompt,
  parseProvisions,
} from "@/lib/llm/prompts/keyProvisions";
import {
  getCachedRegulation,
  upsertRegulationCache,
} from "@/lib/db/cache";
import type { Regulation } from "@/lib/types";

const MODEL = "gemini-2.5-flash" as const;

interface RequestBody {
  regulation: Regulation;
}

export async function POST(req: Request) {
  if (!isGeminiConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }
  const body = (await req.json()) as RequestBody;
  if (!body?.regulation?.id) {
    return NextResponse.json({ error: "missing regulation" }, { status: 400 });
  }
  const reg = body.regulation;

  // Cache hit?
  if (isSupabaseConfigured) {
    try {
      const cached = await getCachedRegulation(reg.id);
      if (cached?.longSummary && cached.keyProvisions) {
        return NextResponse.json({
          longSummary: cached.longSummary,
          keyProvisions: cached.keyProvisions,
          model: cached.modelVersion,
          cached: true,
        });
      }
    } catch {
      // fall through to generation
    }
  }

  try {
    const longPrompt = buildLongSummaryPrompt(reg);
    const provisionsPrompt = buildKeyProvisionsPrompt(reg);

    const [longResult, provisionsRaw] = await Promise.all([
      generateWithGate(
        (attempt) =>
          generate(longPrompt.prompt, {
            model: MODEL,
            systemInstruction: longPrompt.systemInstruction,
            temperature: 0.4 + attempt * 0.1,
            maxOutputTokens: 1200,
          }),
        { maxRetries: 1 },
      ),
      generate(provisionsPrompt.prompt, {
        model: MODEL,
        systemInstruction: provisionsPrompt.systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 800,
      }),
    ]);

    const provisions = parseProvisions(provisionsRaw);

    if (isSupabaseConfigured) {
      try {
        await upsertRegulationCache({
          documentId: reg.id,
          docketId: reg.docketId,
          longSummary: longResult.text,
          keyProvisions: provisions,
          modelVersion: MODEL,
        });
      } catch {
        // non-fatal: return uncached
      }
    }

    return NextResponse.json({
      longSummary: longResult.text,
      keyProvisions: provisions,
      model: MODEL,
      cached: false,
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
