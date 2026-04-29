import { NextResponse } from "next/server";
import {
  isClerkConfigured,
  isResendConfigured,
  isSupabaseConfigured,
} from "@/lib/config";
import {
  isAuthorizedCron,
  currentDayOfWeekIn,
  isWithinQuietHours,
} from "@/lib/cron-auth";
import { getUserEmail, getUserName } from "@/lib/auth";
import { listAllProfiles } from "@/lib/db/profiles";
import { listAllEmailPreferences } from "@/lib/db/emailPreferences";
import { listCommented } from "@/lib/db/commented";
import { buildRegulationsUrl, mapApiResponse } from "@/lib/regulationsApi";
import { rankRegulations } from "@/lib/ranking";
import { enrichRegulationsWithSemanticScores } from "@/lib/semantic";
import { sendEmail } from "@/lib/email/send";
import { buildDigestEmail } from "@/lib/email/templates/digest";

const WEEKLY_DELIVERY_DAY = 0; // Sunday

interface RunResult {
  ok: true;
  fanout: number;
  matched: number;
  sent: number;
  skipped: Record<string, number>;
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isResendConfigured || !isSupabaseConfigured || !isClerkConfigured) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 501 },
    );
  }

  const profiles = await listAllProfiles();
  const allPrefs = await listAllEmailPreferences();
  const prefsByUser = new Map(allPrefs.map((p) => [p.userId, p]));

  // Single shared regulations.gov fetch; all users share the same pool.
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

  const skipped: Record<string, number> = {
    off: 0,
    weekly_wrong_day: 0,
    quiet_hours: 0,
    no_email: 0,
    no_matches: 0,
    send_skip: 0,
    duplicate_today: 0,
  };
  let matched = 0;
  let sent = 0;

  for (const profile of profiles) {
    const prefs = prefsByUser.get(profile.userId);
    const freq = prefs?.digestFrequency ?? "weekly";
    if (freq === "off") {
      skipped.off++;
      continue;
    }
    const tz = prefs?.timezone ?? "America/New_York";
    // Note: digest_time preference is intentionally NOT enforced here.
    // Vercel Hobby caps cron at once per day, so we run at a single fixed
    // UTC hour and fan out to every eligible user. To honor digest_time
    // per user, switch to an hourly cron (Vercel Pro or an external
    // scheduler hitting this endpoint with the CRON_SECRET).
    if (freq === "weekly" && currentDayOfWeekIn(tz) !== WEEKLY_DELIVERY_DAY) {
      skipped.weekly_wrong_day++;
      continue;
    }
    if (
      isWithinQuietHours(tz, prefs?.quietHoursStart, prefs?.quietHoursEnd)
    ) {
      skipped.quiet_hours++;
      continue;
    }

    const email = prefs?.emailAddress || (await getUserEmail(profile.userId));
    if (!email) {
      skipped.no_email++;
      continue;
    }

    matched++;

    // Build personalized top-5: rank, exclude already-commented, optionally
    // skip topics the user muted.
    const commented = new Set(
      (await listCommented(profile.userId)).map((c) => c.documentId),
    );
    const muted = new Set(prefs?.mutedTopics ?? []);
    const semanticRegs = await enrichRegulationsWithSemanticScores(
      profile.userId,
      allRegs,
    );
    const ranked = rankRegulations(semanticRegs, profile)
      .filter((r) => r.baseScore > 0)
      .filter((r) => !commented.has(r.id))
      .filter((r) => r.topics.every((t) => !muted.has(t)) || r.topics.length === 0);

    const top = ranked.slice(0, 5);
    if (top.length < 3) {
      skipped.no_matches++;
      continue;
    }

    const greetingName = profile.displayName || (await getUserName(profile.userId)) || undefined;
    const built = buildDigestEmail({
      userId: profile.userId,
      displayName: greetingName,
      regulations: top,
      topicCount: profile.topics.length,
    });

    const result = await sendEmail({
      to: email,
      subject: built.subject,
      html: built.html,
      text: built.text,
      userId: profile.userId,
      kind: "digest",
      // Daily-digest opt-in bypasses the 3-per-7-day cap.
      bypassCap: freq === "daily",
    });

    if (result.ok) {
      sent++;
    } else {
      skipped.send_skip++;
    }
  }

  const out: RunResult = {
    ok: true,
    fanout: profiles.length,
    matched,
    sent,
    skipped,
  };
  return NextResponse.json(out);
}
