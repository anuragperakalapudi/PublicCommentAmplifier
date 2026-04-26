import { supabaseAdmin } from "./client";

export interface RegulationCacheRow {
  documentId: string;
  docketId: string | null;
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
    docketId: data.docket_id ?? null,
    shortSummary: data.short_summary,
    longSummary: data.long_summary,
    keyProvisions: data.key_provisions,
    modelVersion: data.model_version,
    generatedAt: data.generated_at,
  };
}

// Returns a Map<documentId, docketId> for the given doc ids. Used by the
// final-rule cron to resolve saved/commented documents to dockets.
export async function getCachedDocketIds(
  documentIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const sb = supabaseAdmin();
  if (!sb || documentIds.length === 0) return out;
  const { data, error } = await sb
    .from("regulation_cache")
    .select("document_id, docket_id")
    .in("document_id", documentIds)
    .not("docket_id", "is", null);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    if (row.docket_id) {
      out.set(row.document_id as string, row.docket_id as string);
    }
  }
  return out;
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
  const payload: Record<string, unknown> = {
    document_id: row.documentId,
    generated_at: new Date().toISOString(),
  };
  // Only set fields that were explicitly provided so partial updates don't
  // wipe out previously cached fields (e.g., a docket_id-only write
  // shouldn't null out long_summary).
  if (row.docketId !== undefined) payload.docket_id = row.docketId;
  if (row.shortSummary !== undefined) payload.short_summary = row.shortSummary;
  if (row.longSummary !== undefined) payload.long_summary = row.longSummary;
  if (row.keyProvisions !== undefined) payload.key_provisions = row.keyProvisions;
  if (row.modelVersion !== undefined) payload.model_version = row.modelVersion;

  const { error } = await sb
    .from("regulation_cache")
    .upsert(payload, { onConflict: "document_id" });
  if (error) throw new Error(error.message);
}
