import { supabaseAdmin } from "./client";

export async function listSaved(userId: string): Promise<string[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("saved_regulations")
    .select("document_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { document_id: string }) => r.document_id);
}

export async function addSaved(
  userId: string,
  documentId: string,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("saved_regulations")
    .upsert(
      { user_id: userId, document_id: documentId },
      { onConflict: "user_id,document_id" },
    );
  if (error) throw new Error(error.message);
}

export async function removeSaved(
  userId: string,
  documentId: string,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("saved_regulations")
    .delete()
    .eq("user_id", userId)
    .eq("document_id", documentId);
  if (error) throw new Error(error.message);
}

export async function deleteAllSaved(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("saved_regulations")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export interface SavedRow {
  userId: string;
  documentId: string;
}

// Used by closing-soon cron to fan out across every saved rule.
export async function listAllSaved(): Promise<SavedRow[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("saved_regulations")
    .select("user_id, document_id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    userId: r.user_id as string,
    documentId: r.document_id as string,
  }));
}
