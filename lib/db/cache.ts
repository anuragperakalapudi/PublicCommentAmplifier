import { supabaseAdmin } from "./client";

export interface RegulationCacheRow {
  documentId: string;
  shortSummary: string | null;
  longSummary: string | null;
  keyProvisions: string[] | null;
  modelVersion: string | null;
  generatedAt: string;
}

export async function getCachedRegulation(
  documentId: string,
): Promise<RegulationCacheRow | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("regulation_cache")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    documentId: data.document_id,
    shortSummary: data.short_summary,
    longSummary: data.long_summary,
    keyProvisions: data.key_provisions,
    modelVersion: data.model_version,
    generatedAt: data.generated_at,
  };
}

export async function getCachedShortSummaries(
  documentIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const sb = supabaseAdmin();
  if (!sb || documentIds.length === 0) return out;
  const { data, error } = await sb
    .from("regulation_cache")
    .select("document_id, short_summary")
    .in("document_id", documentIds)
    .not("short_summary", "is", null);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    if (row.short_summary)
      out.set(row.document_id as string, row.short_summary as string);
  }
  return out;
}

export async function upsertRegulationCache(
  row: Partial<RegulationCacheRow> & { documentId: string },
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("regulation_cache").upsert(
    {
      document_id: row.documentId,
      short_summary: row.shortSummary ?? null,
      long_summary: row.longSummary ?? null,
      key_provisions: row.keyProvisions ?? null,
      model_version: row.modelVersion ?? null,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "document_id" },
  );
  if (error) throw new Error(error.message);
}
