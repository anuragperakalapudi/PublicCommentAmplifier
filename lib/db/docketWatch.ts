import { supabaseAdmin } from "./client";

export interface DocketWatchRow {
  userId: string;
  docketId: string;
  lastSeenDocuments: string[];
  addedAt: string;
  lastPolledAt: string | null;
}

// Adds a docket to the watch list (idempotent). Called when a user saves or
// marks-commented a regulation; the docket id is the regulation's parent.
export async function addDocketWatch(
  userId: string,
  docketId: string,
  initialDocuments: string[] = [],
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("docket_watch").upsert(
    {
      user_id: userId,
      docket_id: docketId,
      last_seen_documents: initialDocuments,
    },
    { onConflict: "user_id,docket_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}

export async function listAllWatched(): Promise<DocketWatchRow[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.from("docket_watch").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    userId: r.user_id,
    docketId: r.docket_id,
    lastSeenDocuments: r.last_seen_documents ?? [],
    addedAt: r.added_at,
    lastPolledAt: r.last_polled_at,
  }));
}

export async function updateWatchSnapshot(
  userId: string,
  docketId: string,
  documents: string[],
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("docket_watch")
    .update({
      last_seen_documents: documents,
      last_polled_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("docket_id", docketId);
  if (error) throw new Error(error.message);
}

export async function deleteAllWatched(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("docket_watch")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
