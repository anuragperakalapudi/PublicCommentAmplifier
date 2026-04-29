import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { buildRegulationsUrl, mapApiResponse } from "@/lib/regulationsApi";
import { isSupabaseConfigured } from "@/lib/config";
import { getCachedShortSummaries } from "@/lib/db/cache";
import { enrichRegulationsWithSemanticScores } from "@/lib/semantic";
import type { Regulation } from "@/lib/types";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}

const memCache = new Map<string, CacheEntry>();

async function withSemanticScores(payload: {
  regulations: Regulation[];
  source: string;
  error?: string;
}) {
  let userId: string | null = null;
  try {
    userId = await currentUserId();
  } catch {
    userId = null;
  }
  return {
    ...payload,
    regulations: await enrichRegulationsWithSemanticScores(
      userId,
      payload.regulations,
    ),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchTerm = url.searchParams.get("searchTerm")?.trim() ?? "";

  const cacheKey = searchTerm
    ? `search:${searchTerm.toLowerCase()}`
    : "all-open-proposed-rules";

  const cached = memCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(await withSemanticScores(cached.data as {
      regulations: Regulation[];
      source: string;
      error?: string;
    }), {
      headers: { "x-pca-cache": "hit" },
    });
  }

  const apiKey = process.env.REGULATIONS_GOV_API_KEY ?? "DEMO_KEY";
  const apiUrl = buildRegulationsUrl(searchTerm || undefined);

  try {
    const res = await fetch(apiUrl, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`regulations.gov returned ${res.status}`);

    const json = (await res.json()) as { data?: unknown[] };
    const items = Array.isArray(json.data) ? json.data : [];
    // Look up cached LLM short summaries for the docs in this batch (when
    // Supabase is configured). Misses fall through to the truncated abstract.
    let cached: Map<string, string> | undefined;
    if (isSupabaseConfigured) {
      try {
        const ids = (items as Array<{ id?: string }>)
          .map((it) => it?.id)
          .filter((id): id is string => !!id);
        cached = await getCachedShortSummaries(ids);
      } catch {
        // non-fatal: feed still renders with truncated abstracts
      }
    }
    const mapped = mapApiResponse(items as never[], [], cached);

    const payload = {
      regulations: mapped,
      source: "api" as const,
    };

    memCache.set(cacheKey, {
      data: payload,
      expires: Date.now() + CACHE_TTL_MS,
    });
    return NextResponse.json(await withSemanticScores(payload), {
      headers: { "x-pca-cache": "miss" },
    });
  } catch (err) {
    const payload = {
      regulations: [] as Regulation[],
      source: "error" as const,
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(await withSemanticScores(payload), {
      headers: { "x-pca-cache": "error" },
    });
  }
}
