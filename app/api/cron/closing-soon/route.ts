import { NextResponse } from "next/server";
import {
  isClerkConfigured,
  isResendConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getUserEmail, getUserName } from "@/lib/auth";
import { listAllProfiles } from "@/lib/db/profiles";
import { listAllEmailPreferences } from "@/lib/db/emailPreferences";
import { listAllSaved } from "@/lib/db/saved";
import { buildRegulationsUrl, mapApiResponse } from "@/lib/regulationsApi";
import { daysUntil } from "@/lib/ranking";
import { sendEmail } from "@/lib/email/send";
import { buildClosingSoonEmail } from "@/lib/email/templates/closingSoon";
import type { EmailKind } from "@/lib/db/emailLog";

type Threshold = 7 | 3 | 1;

function thresholdFor(days: number): Threshold | null {
  if (days === 7) return 7;
  if (days === 3) return 3;
  if (days === 1) return 1;
  return null;
}

function kindFor(t: Threshold): EmailKind {
  return `closing-soon-${t}d` as EmailKind;
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isResendConfigured || !isSupabaseConfigured || !isClerkConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  // Pull the open-rule pool once; we'll look up each saved rule's deadline.
  const apiKey = process.env.REGULATIONS_GOV_API_KEY ?? "DEMO_KEY";
  const apiRes = await fetch(buildRegulationsUrl(), {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });
  if (!apiRes.ok) {
    return NextResponse.json(
      { error: "fetch_failed", status: apiRes.status },
      { status: 502 },
    );
  }
  const json = (await apiRes.json()) as { data?: unknown[] };
  const items = Array.isArray(json.data) ? json.data : [];
  const allRegs = mapApiResponse(items as never[], []);
  const regsById = new Map(allRegs.map((r) => [r.id, r]));

  const profiles = await listAllProfiles();
  const profilesById = new Map(profiles.map((p) => [p.userId, p]));
  const allPrefs = await listAllEmailPreferences();
  const prefsByUser = new Map(allPrefs.map((p) => [p.userId, p]));
  const saved = await listAllSaved();

  const skipped: Record<string, number> = {
    alerts_off: 0,
    no_email: 0,
    rule_missing: 0,
    not_at_threshold: 0,
    send_skip: 0,
  };
  let sent = 0;
  let evaluated = 0;

  for (const row of saved) {
    evaluated++;
    const reg = regsById.get(row.documentId);
    if (!reg) {
      skipped.rule_missing++;
      continue;
    }
    const t = thresholdFor(daysUntil(reg.commentEndDate));
    if (!t) {
      skipped.not_at_threshold++;
      continue;
    }
    const prefs = prefsByUser.get(row.userId);
    if (prefs && !prefs.closingSoonAlerts) {
      skipped.alerts_off++;
      continue;
    }
    const email = prefs?.emailAddress || (await getUserEmail(row.userId));
    if (!email) {
      skipped.no_email++;
      continue;
    }
    const profile = profilesById.get(row.userId);
    const greetingName =
      profile?.displayName || (await getUserName(row.userId)) || undefined;

    const built = buildClosingSoonEmail({
      userId: row.userId,
      displayName: greetingName,
      regulation: reg,
      daysRemaining: t,
    });
    const kind = kindFor(t);
    const result = await sendEmail({
      to: email,
      subject: built.subject,
      html: built.html,
      text: built.text,
      userId: row.userId,
      kind,
      documentId: row.documentId,
      enforceIdempotency: true,
    });
    if (result.ok) {
      sent++;
    } else {
      skipped.send_skip++;
    }
  }

  return NextResponse.json({
    ok: true,
    savedRows: saved.length,
    evaluated,
    sent,
    skipped,
  });
}
