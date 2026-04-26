import { supabaseAdmin } from "./client";

export type EmailKind =
  | "digest"
  | "closing-soon-7d"
  | "closing-soon-3d"
  | "closing-soon-1d"
  | "final-rule";

export interface EmailLogEntry {
  userId: string;
  kind: EmailKind;
  documentId?: string | null;
  docketId?: string | null;
  resendId?: string | null;
}

export async function recordEmailSent(entry: EmailLogEntry): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("email_log").insert({
    user_id: entry.userId,
    kind: entry.kind,
    document_id: entry.documentId ?? null,
    docket_id: entry.docketId ?? null,
    resend_id: entry.resendId ?? null,
  });
  if (error) throw new Error(error.message);
}

// True if (user, kind, document_id) has ever been sent. Used by closing-soon
// to never double-send the 7d / 3d / 1d alert for the same rule.
export async function hasAlreadySent(
  userId: string,
  kind: EmailKind,
  documentId?: string,
): Promise<boolean> {
  const sb = supabaseAdmin();
  if (!sb) return false;
  let q = sb
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind);
  if (documentId !== undefined) {
    q = q.eq("document_id", documentId);
  }
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// Count of emails sent to this user in the trailing 7 days. Used to enforce
// the FRD §3.7 hard cap of 3 emails / 7 days (digest opt-in to daily bypasses).
export async function recentEmailCount(userId: string): Promise<number> {
  const sb = supabaseAdmin();
  if (!sb) return 0;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { count, error } = await sb
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("sent_at", sevenDaysAgo);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function deleteAllEmailLog(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("email_log").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export interface FinalRuleEvent {
  documentId: string;
  docketId: string;
  sentAt: string;
}

// Surfaces final-rule notifications on the user's activity timeline.
export async function listFinalRuleEvents(
  userId: string,
): Promise<FinalRuleEvent[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("email_log")
    .select("document_id, docket_id, sent_at")
    .eq("user_id", userId)
    .eq("kind", "final-rule")
    .order("sent_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((r) => r.document_id && r.docket_id)
    .map((r) => ({
      documentId: r.document_id as string,
      docketId: r.docket_id as string,
      sentAt: r.sent_at as string,
    }));
}
