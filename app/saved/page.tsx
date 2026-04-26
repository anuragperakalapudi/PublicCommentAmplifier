"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { useSavedRegulations } from "@/hooks/useSavedRegulations";
import { useCommentedRegulations } from "@/hooks/useCommentedRegulations";
import { rankRegulations } from "@/lib/ranking";
import type { Regulation, ScoredRegulation } from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";
import {
  RegulationCard,
  RegulationCardSkeleton,
} from "@/components/feed/RegulationCard";

const PAGE_SIZE = 20;

export default function SavedPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const {
    saved,
    hydrated: savedHydrated,
    isSaved,
    toggle: toggleSaved,
  } = useSavedRegulations();
  const { isCommented } = useCommentedRegulations();
  const [pool, setPool] = useState<ScoredRegulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/regulations")
      .then(async (r) => {
        const json = (await r.json()) as { regulations: Regulation[] };
        if (cancelled) return;
        setPool(rankRegulations(json.regulations, profile));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPool([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const savedRegs = useMemo(() => {
    return pool
      .filter((r) => saved.has(r.id))
      .sort(
        (a, b) =>
          new Date(a.commentEndDate).getTime() -
          new Date(b.commentEndDate).getTime(),
      );
  }, [pool, saved]);

  // Reset pagination when the saved set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [saved]);

  const visibleSaved = useMemo(
    () => savedRegs.slice(0, visibleCount),
    [savedRegs, visibleCount],
  );
  const remainingSaved = savedRegs.length - visibleSaved.length;

  // Saved IDs that aren't in the current open-rules pool (closed or otherwise
  // missing). We show them as stubs so the user can still link out.
  const orphanIds = useMemo(() => {
    const inPool = new Set(pool.map((r) => r.id));
    return Array.from(saved).filter((id) => !inPool.has(id));
  }, [pool, saved]);

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  const isLoading = loading || !savedHydrated;
  const totalSaved = saved.size;

  return (
    <main className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
            <Bookmark className="h-3.5 w-3.5" /> Saved rules
          </span>
          <h1 className="headline text-4xl md:text-5xl">
            Rules you bookmarked.
          </h1>
          <p className="max-w-2xl text-base text-ink-600">
            {totalSaved === 0
              ? "Nothing saved yet. Use the bookmark icon on any card."
              : `${totalSaved} ${totalSaved === 1 ? "rule" : "rules"}, sorted by closing deadline.`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <RegulationCardSkeleton />
            <RegulationCardSkeleton />
          </div>
        ) : totalSaved === 0 ? (
          <div className="rounded-2xl border border-rule bg-paper p-10 text-center">
            <p className="font-display text-2xl">You haven&rsquo;t saved any rules yet.</p>
            <p className="mt-2 text-ink-600">
              Bookmark a rule from your feed to keep an eye on its deadline.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-cream-50 hover:bg-ink-600"
            >
              Back to the feed
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {visibleSaved.map((reg, i) => (
              <RegulationCard
                key={reg.id}
                reg={reg}
                topicCount={profile.topics.length}
                index={i}
                saved={isSaved(reg.id)}
                commented={isCommented(reg.id)}
                onToggleSaved={toggleSaved}
              />
            ))}
            {remainingSaved > 0 && (
              <div className="flex justify-center pt-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-5 py-2.5 text-sm font-medium text-ink hover:border-ink/40 hover:shadow-card"
                >
                  Show more
                  <span className="font-mono text-xs text-muted">
                    {remainingSaved} remaining
                  </span>
                </button>
              </div>
            )}
            {orphanIds.length > 0 && (
              <div className="rounded-xl border border-rule bg-cream-50 p-5">
                <p className="text-sm font-medium text-ink">
                  {orphanIds.length} saved{" "}
                  {orphanIds.length === 1 ? "rule" : "rules"} not in the current
                  open pool.
                </p>
                <p className="mt-1 text-sm text-ink-600">
                  These may have closed or been archived. You can still view
                  them on regulations.gov.
                </p>
                <ul className="mt-4 space-y-2">
                  {orphanIds.map((id) => (
                    <li key={id} className="flex items-center justify-between gap-3">
                      <code className="font-mono text-xs text-ink">{id}</code>
                      <a
                        href={`https://www.regulations.gov/document/${encodeURIComponent(id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
