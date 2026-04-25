import { NextResponse } from "next/server";
import { buildRegulationsUrl, mapApiResponse } from "@/lib/regulationsApi";
import type { Regulation } from "@/lib/types";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T = unknown> {
  data: T;
  expires: number;
}

const memCache = new Map<string, CacheEntry>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchTerm = url.searchParams.get("searchTerm")?.trim() ?? "";

  const cacheKey = searchTerm
    ? `search:${searchTerm.toLowerCase()}`
    : "all-open-proposed-rules";

  const cached = memCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data, {
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
    const mapped = mapApiResponse(items as never[], []);

    const payload = {
      regulations: mapped,
      source: "api" as const,
    };

    memCache.set(cacheKey, {
      data: payload,
      expires: Date.now() + CACHE_TTL_MS,
    });
    return NextResponse.json(payload, { headers: { "x-pca-cache": "miss" } });
  } catch (err) {
    const payload = {
      regulations: [] as Regulation[],
      source: "error" as const,
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(payload, {
      headers: { "x-pca-cache": "error" },
    });
  }
}
