import type { RankingSignal } from "../types";
import { supabaseAdmin } from "./client";

export interface RankingFeedbackRow {
  documentId: string;
  signal: RankingSignal;
  createdAt: string;
}

export async function listFeedback(
  userId: string,
): Promise<RankingFeedbackRow[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("ranking_feedback")
    .select("document_id, signal, created_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(
    (r: { document_id: string; signal: string; created_at: string }) => ({
      documentId: r.document_id,
      signal: r.signal as RankingSignal,
      createdAt: r.created_at,
    }),
  );
}

export async function setFeedback(
  userId: string,
  documentId: string,
  signal: RankingSignal | null,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  if (!signal) {
    const { error } = await sb
      .from("ranking_feedback")
      .delete()
      .eq("user_id", userId)
      .eq("document_id", documentId);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await sb.from("ranking_feedback").upsert(
    {
      user_id: userId,
      document_id: documentId,
      signal,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,document_id" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteAllFeedback(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("ranking_feedback")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
