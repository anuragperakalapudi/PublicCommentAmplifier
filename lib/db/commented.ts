import { supabaseAdmin } from "./client";

export interface CommentedRow {
  documentId: string;
  markedAt: string;
  commentText: string | null;
  source: "manual_paste" | "api_submitted";
}

export async function listCommented(userId: string): Promise<CommentedRow[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("commented_regulations")
    .select("document_id, marked_at, comment_text, source")
    .eq("user_id", userId)
    .order("marked_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(
    (r: {
      document_id: string;
      marked_at: string;
      comment_text: string | null;
      source: string;
    }) => ({
      documentId: r.document_id,
      markedAt: r.marked_at,
      commentText: r.comment_text,
      source: (r.source as "manual_paste" | "api_submitted") ?? "manual_paste",
    }),
  );
}

export async function markCommented(
  userId: string,
  documentId: string,
  commentText: string | null,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("commented_regulations").upsert(
    {
      user_id: userId,
      document_id: documentId,
      comment_text: commentText,
      source: "manual_paste",
    },
    { onConflict: "user_id,document_id" },
  );
  if (error) throw new Error(error.message);
}

export async function unmarkCommented(
  userId: string,
  documentId: string,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("commented_regulations")
    .delete()
    .eq("user_id", userId)
    .eq("document_id", documentId);
  if (error) throw new Error(error.message);
}

export async function deleteAllCommented(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("commented_regulations")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
