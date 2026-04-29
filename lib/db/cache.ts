import { parseVector, vectorToSql } from "../embeddingInputs";
import { supabaseAdmin } from "./client";

export interface RegulationCacheRow {
  documentId: string;
  docketId: string | null;
  shortSummary: string | null;
  longSummary: string | null;
  keyProvisions: string[] | null;
  modelVersion: string | null;
  generatedAt: string;
  embedding?: number[] | null;
  embeddingModel?: string | null;
  embeddingHash?: string | null;
  embeddingGeneratedAt?: string | null;
}

export interface CachedEmbedding {
  documentId: string;
  embedding: number[];
  embeddingModel: string | null;
  embeddingHash: string | null;
  embeddingGeneratedAt: string | null;
}

export interface WhyInFeedCacheRow {
  userId: string;
  documentId: string;
  text: string;
  flags: string[];
  contextHash: string;
  modelVersion: string;
  createdAt: string;
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
    embedding: parseVector(data.embedding),
    embeddingModel: data.embedding_model ?? null,
    embeddingHash: data.embedding_hash ?? null,
    embeddingGeneratedAt: data.embedding_generated_at ?? null,
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

export async function getCachedEmbeddings(
  documentIds: string[],
): Promise<Map<string, CachedEmbedding>> {
  const out = new Map<string, CachedEmbedding>();
  const sb = supabaseAdmin();
  if (!sb || documentIds.length === 0) return out;
  const { data, error } = await sb
    .from("regulation_cache")
    .select("document_id, embedding, embedding_model, embedding_hash, embedding_generated_at")
    .in("document_id", documentIds)
    .not("embedding", "is", null);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const embedding = parseVector(row.embedding);
    if (!embedding) continue;
    out.set(row.document_id as string, {
      documentId: row.document_id as string,
      embedding,
      embeddingModel: row.embedding_model as string | null,
      embeddingHash: row.embedding_hash as string | null,
      embeddingGeneratedAt: row.embedding_generated_at as string | null,
    });
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
  if (row.embedding !== undefined)
    payload.embedding = row.embedding ? vectorToSql(row.embedding) : null;
  if (row.embeddingModel !== undefined)
    payload.embedding_model = row.embeddingModel;
  if (row.embeddingHash !== undefined)
    payload.embedding_hash = row.embeddingHash;
  if (row.embeddingGeneratedAt !== undefined)
    payload.embedding_generated_at = row.embeddingGeneratedAt;

  const { error } = await sb
    .from("regulation_cache")
    .upsert(payload, { onConflict: "document_id" });
  if (error) throw new Error(error.message);
}

export async function getCachedWhyInFeed(
  userId: string,
  documentId: string,
  contextHash: string,
): Promise<WhyInFeedCacheRow | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("why_in_feed_cache")
    .select("*")
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .eq("context_hash", contextHash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    userId: data.user_id,
    documentId: data.document_id,
    text: data.text,
    flags: data.flags ?? [],
    contextHash: data.context_hash,
    modelVersion: data.model_version,
    createdAt: data.created_at,
  };
}

export async function upsertWhyInFeed(
  row: Omit<WhyInFeedCacheRow, "createdAt">,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("why_in_feed_cache").upsert(
    {
      user_id: row.userId,
      document_id: row.documentId,
      text: row.text,
      flags: row.flags,
      context_hash: row.contextHash,
      model_version: row.modelVersion,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,document_id" },
  );
  if (error) throw new Error(error.message);
}

export async function listWhyInFeedForUser(
  userId: string,
): Promise<WhyInFeedCacheRow[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("why_in_feed_cache")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    documentId: row.document_id as string,
    text: row.text as string,
    flags: (row.flags ?? []) as string[],
    contextHash: row.context_hash as string,
    modelVersion: row.model_version as string,
    createdAt: row.created_at as string,
  }));
}

export async function deleteWhyInFeedForUser(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("why_in_feed_cache")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteWhyInFeedForUserSafe(
  userId: string,
): Promise<void> {
  try {
    await deleteWhyInFeedForUser(userId);
  } catch {
    // Cache invalidation should not block user data writes.
  }
}
