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
import { listAllCommentedDocumentIds } from "@/lib/db/commented";
import {
  addDocketWatch,
  listAllWatched,
  updateWatchSnapshot,
} from "@/lib/db/docketWatch";
import { getCachedDocketIds } from "@/lib/db/cache";
import { agencyDisplayName } from "@/lib/regulationsApi";
import { sendEmail } from "@/lib/email/send";
import { buildFinalRuleEmail } from "@/lib/email/templates/finalRule";

const MAX_DOCKETS_PER_RUN = 60;

interface DocItem {
  id: string;
  attributes?: {
    documentType?: string;
    title?: string;
    agencyId?: string;
  };
}

async function fetchDocketDocuments(
  docketId: string,
  apiKey: string,
): Promise<DocItem[]> {
  const url = `https://api.regulations.gov/v4/documents?filter[docketId]=${encodeURIComponent(docketId)}&page[size]=250`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: DocItem[] };
  return Array.isArray(json.data) ? json.data : [];
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isResendConfigured || !isSupabaseConfigured || !isClerkConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const apiKey = process.env.REGULATIONS_GOV_API_KEY ?? "DEMO_KEY";

  // 1. Build the engagement set: every (user, document_id) the user has
  //    saved or commented.
  const saved = await listAllSaved();
  const commented = await listAllCommentedDocumentIds();
  const engagement = [...saved, ...commented];
  const uniqueDocIds = Array.from(new Set(engagement.map((e) => e.documentId)));

  // 2. Resolve each document_id → docket_id via regulation_cache.
  const docketByDoc = await getCachedDocketIds(uniqueDocIds);

  // 3. Make sure docket_watch has a row for every (user, docket_id) pair.
  const userDocketPairs: Array<{ userId: string; docketId: string; docId: string }> = [];
  for (const e of engagement) {
    const docketId = docketByDoc.get(e.documentId);
    if (!docketId) continue;
    userDocketPairs.push({
      userId: e.userId,
      docketId,
      docId: e.documentId,
    });
    try {
      await addDocketWatch(e.userId, docketId);
    } catch {
      // non-fatal: race with another cron run is fine (upsert)
    }
  }

  // 4. Poll each docket. Cap per run to respect rate limits.
  const watched = await listAllWatched();
  const uniqueDocketIds = Array.from(new Set(watched.map((w) => w.docketId)));
  const targets = uniqueDocketIds.slice(0, MAX_DOCKETS_PER_RUN);

  const profiles = await listAllProfiles();
  const profilesById = new Map(profiles.map((p) => [p.userId, p]));
  const allPrefs = await listAllEmailPreferences();
  const prefsByUser = new Map(allPrefs.map((p) => [p.userId, p]));

  const skipped: Record<string, number> = {
    no_new_rule: 0,
    alerts_off: 0,
    no_email: 0,
    send_skip: 0,
    api_error: 0,
  };
  let sent = 0;
  let polled = 0;

  for (const docketId of targets) {
    let docs: DocItem[];
    try {
      docs = await fetchDocketDocuments(docketId, apiKey);
    } catch {
      skipped.api_error++;
      continue;
    }
    polled++;
    const seenNow = docs.map((d) => d.id);
    const finalRules = docs.filter(
      (d) => d.attributes?.documentType === "Rule",
    );

    // For each user watching this docket, find new "Rule" documents.
    const watchersOfThisDocket = watched.filter((w) => w.docketId === docketId);
    for (const watch of watchersOfThisDocket) {
      const previouslySeen = new Set(watch.lastSeenDocuments);
      const newFinalRules = finalRules.filter((d) => !previouslySeen.has(d.id));
      if (newFinalRules.length === 0) {
        skipped.no_new_rule++;
        continue;
      }

      const prefs = prefsByUser.get(watch.userId);
      if (prefs && !prefs.finalRuleAlerts) {
        skipped.alerts_off++;
        continue;
      }
      const email = prefs?.emailAddress || (await getUserEmail(watch.userId));
      if (!email) {
        skipped.no_email++;
        continue;
      }
      const profile = profilesById.get(watch.userId);
      const greetingName =
        profile?.displayName ||
        (await getUserName(watch.userId)) ||
        undefined;

      const originalEngagement = userDocketPairs.find(
        (p) => p.userId === watch.userId && p.docketId === docketId,
      );

      // Send one email per new Rule document; usually there's only one.
      for (const rule of newFinalRules) {
        const built = buildFinalRuleEmail({
          userId: watch.userId,
          displayName: greetingName,
          docketId,
          finalRuleDocumentId: rule.id,
          finalRuleTitle: rule.attributes?.title ?? "Final rule posted",
          agencyName: agencyDisplayName(
            rule.attributes?.agencyId ?? "?",
          ),
          originalDocumentId: originalEngagement?.docId,
        });
        const result = await sendEmail({
          to: email,
          subject: built.subject,
          html: built.html,
          text: built.text,
          userId: watch.userId,
          kind: "final-rule",
          documentId: rule.id,
          docketId,
          enforceIdempotency: true,
        });
        if (result.ok) sent++;
        else skipped.send_skip++;
      }
    }

    // Update last_seen_documents for every watcher of this docket.
    for (const watch of watchersOfThisDocket) {
      try {
        await updateWatchSnapshot(watch.userId, watch.docketId, seenNow);
      } catch {
        // non-fatal
      }
    }
  }

  return NextResponse.json({
    ok: true,
    engagementRows: engagement.length,
    docketsResolved: docketByDoc.size,
    docketsWatched: watched.length,
    docketsPolled: polled,
    sent,
    skipped,
  });
}
