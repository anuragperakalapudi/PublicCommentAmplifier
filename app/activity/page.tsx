"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, CheckCircle2, Bookmark, Clock, ExternalLink, Megaphone,
} from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { useCommentedRegulations } from "@/hooks/useCommentedRegulations";
import { useSavedRegulations } from "@/hooks/useSavedRegulations";
import type { Regulation } from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { AgencyBadge } from "@/components/shared/AgencyBadge";

interface FinalRuleEvent {
  documentId: string;
  docketId: string;
  sentAt: string;
}

interface TimelineItem {
  kind: "commented" | "saved-closed" | "final-rule";
  documentId: string;
  date: string;
  reg?: Regulation;
  commentText?: string | null;
  docketId?: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const { list: listCommented, hydrated: cHydrated } =
    useCommentedRegulations();
  const { saved, hydrated: sHydrated } = useSavedRegulations();
  const [pool, setPool] = useState<Map<string, Regulation>>(new Map());
  const [loadingPool, setLoadingPool] = useState(true);
  const [finalRuleEvents, setFinalRuleEvents] = useState<FinalRuleEvent[]>([]);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetch("/api/final-rule-events")
      .then(async (r) => {
        if (!r.ok) return;
        const json = (await r.json()) as { events: FinalRuleEvent[] };
        if (cancelled) return;
        setFinalRuleEvents(json.events);
      })
      .catch(() => {
        // silent — section just stays empty
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoadingPool(true);
    fetch("/api/regulations")
      .then(async (r) => {
        const json = (await r.json()) as { regulations: Regulation[] };
        if (cancelled) return;
        const m = new Map<string, Regulation>();
        for (const r of json.regulations) m.set(r.id, r);
        setPool(m);
        setLoadingPool(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPool(new Map());
        setLoadingPool(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const items: TimelineItem[] = useMemo(() => {
    const commentedEntries = listCommented();
    const out: TimelineItem[] = commentedEntries.map((e) => ({
      kind: "commented" as const,
      documentId: e.documentId,
      date: e.markedAt,
      reg: pool.get(e.documentId),
      commentText: e.commentText,
    }));

    // Saved-then-closed: saved IDs whose rule has commentEndDate < today
    // and the user did NOT mark commented.
    const commentedIds = new Set(commentedEntries.map((e) => e.documentId));
    const today = new Date().toISOString().slice(0, 10);
    for (const id of saved) {
      if (commentedIds.has(id)) continue;
      const reg = pool.get(id);
      if (reg && reg.commentEndDate < today) {
        out.push({
          kind: "saved-closed",
          documentId: id,
          date: reg.commentEndDate,
          reg,
        });
      }
    }

    // Final-rule events from email_log (Phase 2 cron output).
    for (const ev of finalRuleEvents) {
      out.push({
        kind: "final-rule",
        documentId: ev.documentId,
        docketId: ev.docketId,
        date: ev.sentAt,
        reg: pool.get(ev.documentId),
      });
    }

    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [listCommented, saved, pool, finalRuleEvents]);

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  const isLoading = loadingPool || !cHydrated || !sHydrated;

  return (
    <main className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
            <Activity className="h-3.5 w-3.5" /> My activity
          </span>
          <h1 className="headline text-4xl md:text-5xl">
            Your civic record.
          </h1>
          <p className="max-w-2xl text-base text-ink-600">
            Comments you marked submitted, and rules that closed before you
            commented. Everything sorted reverse-chronologically.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-24 w-full rounded-xl" />
            <div className="skeleton h-24 w-full rounded-xl" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-rule bg-paper p-10 text-center">
            <p className="font-display text-2xl">No activity yet.</p>
            <p className="mt-2 text-ink-600">
              Submit your first comment, then come back here. The federal record
              will be a little fuller than it was an hour ago.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-cream-50 hover:bg-ink-600"
            >
              Find a rule to comment on
            </Link>
          </div>
        ) : (
          <ol className="relative space-y-5 border-l border-rule pl-6">
            {items.map((item) => (
              <li key={`${item.kind}-${item.documentId}`} className="relative">
                <span
                  className={`absolute -left-[27px] top-2 flex h-4 w-4 items-center justify-center rounded-full ${
                    item.kind === "commented"
                      ? "bg-forest text-cream-50"
                      : item.kind === "final-rule"
                        ? "bg-accent text-cream-50"
                        : "bg-cream-50 text-muted ring-2 ring-rule"
                  }`}
                >
                  {item.kind === "commented" ? (
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  ) : item.kind === "final-rule" ? (
                    <Megaphone className="h-2.5 w-2.5" />
                  ) : (
                    <Bookmark className="h-2.5 w-2.5" />
                  )}
                </span>
                <ActivityCard item={item} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function ActivityCard({ item }: { item: TimelineItem }) {
  const dateLabel = new Date(item.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (item.kind === "commented") {
    return (
      <div className="rounded-xl border border-rule bg-paper p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-medium text-forest">Commented</span>
          <span>·</span>
          <span>{dateLabel}</span>
          {item.reg && (
            <>
              <span>·</span>
              <AgencyBadge
                agencyId={item.reg.agencyId}
                agencyName={item.reg.agencyName}
                size="sm"
              />
            </>
          )}
        </div>
        <h3 className="font-display mt-2 text-lg leading-snug text-ink">
          {item.reg ? (
            <Link
              href={`/regulation/${encodeURIComponent(item.documentId)}`}
              className="hover:underline"
            >
              {item.reg.title}
            </Link>
          ) : (
            <span className="text-ink-600">
              <code className="font-mono text-sm">{item.documentId}</code>
            </span>
          )}
        </h3>
        {item.commentText && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-accent hover:underline">
              Show your submitted text
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-cream-50 p-3 font-mono text-xs text-ink-600">
              {item.commentText}
            </pre>
          </details>
        )}
        {!item.reg && (
          <a
            href={`https://www.regulations.gov/document/${encodeURIComponent(item.documentId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            View on regulations.gov <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  if (item.kind === "final-rule") {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent-50 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-medium text-accent">
            <Megaphone className="mr-1 inline h-3 w-3" />
            Final rule posted
          </span>
          <span>·</span>
          <span>{dateLabel}</span>
          {item.reg && (
            <>
              <span>·</span>
              <AgencyBadge
                agencyId={item.reg.agencyId}
                agencyName={item.reg.agencyName}
                size="sm"
              />
            </>
          )}
        </div>
        <h3 className="font-display mt-2 text-lg leading-snug text-ink">
          {item.reg?.title ?? item.documentId}
        </h3>
        <p className="mt-2 text-xs text-muted">
          The agency posted the final version of a docket you engaged with.
        </p>
        <a
          href={`https://www.regulations.gov/document/${encodeURIComponent(item.documentId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          Read the final rule <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // saved-closed
  return (
    <div className="rounded-xl border border-rule bg-cream-50 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-medium text-ink-600">
          <Clock className="mr-1 inline h-3 w-3" />
          Saved but closed
        </span>
        <span>·</span>
        <span>Closed {dateLabel}</span>
        {item.reg && (
          <>
            <span>·</span>
            <AgencyBadge
              agencyId={item.reg.agencyId}
              agencyName={item.reg.agencyName}
              size="sm"
            />
          </>
        )}
      </div>
      <h3 className="font-display mt-2 text-lg leading-snug text-ink">
        {item.reg?.title ?? item.documentId}
      </h3>
      <p className="mt-2 text-xs text-muted">
        You saved this rule but didn&rsquo;t mark a comment before it closed.
      </p>
    </div>
  );
}
