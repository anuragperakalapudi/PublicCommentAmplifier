import { Resend } from "resend";
import {
  isResendConfigured,
  RESEND_FROM_EMAIL,
} from "@/lib/config";
import {
  hasAlreadySent,
  recentEmailCount,
  recordEmailSent,
  type EmailKind,
} from "@/lib/db/emailLog";

let cachedClient: Resend | null = null;

function client(): Resend | null {
  if (!isResendConfigured) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new Resend(process.env.RESEND_API_KEY!);
  return cachedClient;
}

const HARD_CAP_PER_7_DAYS = 3;

export type SendResult =
  | { ok: true; resendId: string | null }
  | { ok: false; reason: SkipReason }
  | { ok: false; reason: "error"; error: string };

export type SkipReason =
  | "not_configured"
  | "no_recipient"
  | "duplicate"
  | "hard_cap"
  | "quiet_hours";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  userId: string;
  kind: EmailKind;
  documentId?: string;
  docketId?: string;
  // True for the daily-digest opt-in path; bypasses the hard cap.
  bypassCap?: boolean;
  // True for sends where double-fire would be a real bug (closing-soon at a
  // given threshold, final-rule for a given docket). Skips when the
  // (user, kind, documentId) tuple already exists in email_log.
  enforceIdempotency?: boolean;
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const c = client();
  if (!c) return { ok: false, reason: "not_configured" };
  if (!args.to) return { ok: false, reason: "no_recipient" };

  if (args.enforceIdempotency) {
    const dup = await hasAlreadySent(args.userId, args.kind, args.documentId);
    if (dup) return { ok: false, reason: "duplicate" };
  }

  if (!args.bypassCap) {
    const recent = await recentEmailCount(args.userId);
    if (recent >= HARD_CAP_PER_7_DAYS) {
      return { ok: false, reason: "hard_cap" };
    }
  }

  try {
    const res = await c.emails.send({
      from: RESEND_FROM_EMAIL,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        // RFC 8058 one-click unsubscribe.
        "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/email/unsubscribe?user=${encodeURIComponent(args.userId)}&kind=${encodeURIComponent(args.kind)}>, <mailto:unsubscribe@opencomment.org?subject=unsubscribe-${args.kind}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    const resendId = res.data?.id ?? null;
    await recordEmailSent({
      userId: args.userId,
      kind: args.kind,
      documentId: args.documentId,
      docketId: args.docketId,
      resendId,
    });
    return { ok: true, resendId };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
