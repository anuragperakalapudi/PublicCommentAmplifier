import { NextResponse } from "next/server";
import { buildRegulationsUrl, mapApiResponse } from "@/lib/regulationsApi";
import type { Topic } from "@/lib/types";
import { ALL_TOPICS } from "@/lib/types";
import { MOCK_REGULATIONS } from "@/lib/mock/regulations";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  expires: number;
}

const memCache = new Map<string, CacheEntry>();

function isTopic(t: string): t is Topic {
  return (ALL_TOPICS as string[]).includes(t);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTopics = searchParams.get("topics") ?? "";
  const topics: Topic[] = rawTopics
    .split(",")
    .map((t) => t.trim())
    .filter(isTopic);

  const cacheKey = topics.slice().sort().join("|");
  const cached = memCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: { "x-pca-cache": "hit" },
    });
  }

  const apiKey = process.env.REGULATIONS_GOV_API_KEY ?? "DEMO_KEY";
  const url = buildRegulationsUrl(topics);

  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`regulations.gov returned ${res.status}`);

    const json = (await res.json()) as { data?: unknown[] };
    const items = Array.isArray(json.data) ? json.data : [];
    const mapped = mapApiResponse(items as never[], topics);

    // If the API returns nothing useful, blend mock results so the demo never feels empty.
    const payload =
      mapped.length >= 4
        ? { regulations: mapped, source: "api" as const }
        : {
            regulations: [...mapped, ...MOCK_REGULATIONS].slice(0, 12),
            source: mapped.length > 0 ? ("mixed" as const) : ("mock" as const),
          };

    memCache.set(cacheKey, {
      data: payload,
      expires: Date.now() + CACHE_TTL_MS,
    });
    return NextResponse.json(payload, { headers: { "x-pca-cache": "miss" } });
  } catch (err) {
    const payload = {
      regulations: MOCK_REGULATIONS,
      source: "mock" as const,
      error: err instanceof Error ? err.message : "unknown",
    };
    memCache.set(cacheKey, {
      data: payload,
      expires: Date.now() + 60 * 1000,
    });
    return NextResponse.json(payload, {
      headers: { "x-pca-cache": "miss-fallback" },
    });
  }
}
