"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import {
  deriveWeights,
  rankRegulations,
  daysUntil,
  matchPercent,
} from "@/lib/ranking";
import type { Regulation, ScoredRegulation, Topic } from "@/lib/types";
import { ALL_TOPICS, US_STATE_NAMES } from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";
import {
  RegulationCard,
  RegulationCardSkeleton,
} from "@/components/feed/RegulationCard";
import { TrendingRail } from "@/components/feed/TrendingRail";
import {
  FilterRail,
  EMPTY_FILTERS,
  isAnyFilterActive,
  type FilterState,
} from "@/components/feed/FilterRail";
import { useSavedRegulations } from "@/hooks/useSavedRegulations";
import { useCommentedRegulations } from "@/hooks/useCommentedRegulations";
import { useRankingFeedback } from "@/hooks/useRankingFeedback";

const PAGE_SIZE = 20;

type SearchSource = "none" | "server" | "fallback";

function ruleMentionsState(text: string, stateCode: string): boolean {
  const name = US_STATE_NAMES[stateCode];
  const lower = text.toLowerCase();
  return (
    (!!name && lower.includes(name.toLowerCase())) ||
    new RegExp(`\\b${stateCode}\\b`).test(text)
  );
}

function applyFilters(
  regs: ScoredRegulation[],
  f: FilterState,
  topicCount: number,
  stateCodes: string[],
): ScoredRegulation[] {
  return regs.filter((r) => {
    if (f.agencies.length > 0 && !f.agencies.includes(r.agencyId)) return false;
    if (
      f.topics.length > 0 &&
      !r.topics.some((t) => f.topics.includes(t))
    )
      return false;
    if (f.deadline !== "any") {
      const days = daysUntil(r.commentEndDate);
      if (f.deadline === "week" && days > 7) return false;
      if (f.deadline === "month" && days > 30) return false;
    }
    if (f.minMatch > 0) {
      const pct = matchPercent(r.baseScore, topicCount);
      if (pct < f.minMatch) return false;
    }
    if (f.stateRelevant) {
      const text = `${r.title} ${r.summary}`;
      if (!stateCodes.some((code) => ruleMentionsState(text, code))) {
        return false;
      }
    }
    return true;
  });
}

export default function FeedPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const [loading, setLoading] = useState(true);
  const [baseRegulations, setBaseRegulations] = useState<Regulation[]>([]);
  const [source, setSource] = useState<string>("");
  const [errored, setErrored] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Regulation[] | null>(
    null,
  );
  const [searchSource, setSearchSource] = useState<SearchSource>("none");
  const [searching, setSearching] = useState(false);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Hoist save/commented hooks once at the page level so each card doesn't
  // independently fetch + double-fire under React StrictMode.
  const { isSaved, toggle: toggleSaved } = useSavedRegulations();
  const { isCommented } = useCommentedRegulations();
  const { feedback, set: setRankingSignal } = useRankingFeedback();

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (hydrated && !profile) {
      router.replace("/onboarding");
    }
  }, [hydrated, profile, router]);

  // Initial base-pool load (no search query)
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/regulations`)
      .then(async (r) => {
        const json = (await r.json()) as {
          regulations: Regulation[];
          source: string;
        };
        if (cancelled) return;
        setBaseRegulations(json.regulations);
        setSource(json.source);
        setErrored(json.source === "error");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setBaseRegulations([]);
        setSource("error");
        setErrored(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Debounce search input by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Run search when debounced query changes
  useEffect(() => {
    if (!profile) return;
    if (!debouncedQuery) {
      setSearchResults(null);
      setSearchSource("none");
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const runFallback = (): Regulation[] => {
      const q = debouncedQuery.toLowerCase();
      return baseRegulations.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.agencyName.toLowerCase().includes(q) ||
          r.agencyId.toLowerCase().includes(q),
      );
    };

    fetch(`/api/regulations?searchTerm=${encodeURIComponent(debouncedQuery)}`)
      .then(async (r) => {
        const json = (await r.json()) as {
          regulations: Regulation[];
          source: string;
        };
        if (cancelled) return;
        if (json.regulations.length > 0 && json.source === "api") {
          setSearchResults(json.regulations);
          setSearchSource("server");
        } else {
          setSearchResults(runFallback());
          setSearchSource("fallback");
        }
        setSearching(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSearchResults(runFallback());
        setSearchSource("fallback");
        setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, profile, baseRegulations]);

  const feedbackEntries = useMemo(
    () =>
      Array.from(feedback.entries()).map(([documentId, signal]) => ({
        documentId,
        signal,
      })),
    [feedback],
  );

  const rulesById = useMemo(() => {
    const map = new Map<string, Regulation>();
    for (const reg of baseRegulations) map.set(reg.id, reg);
    for (const reg of searchResults ?? []) map.set(reg.id, reg);
    return map;
  }, [baseRegulations, searchResults]);

  const feedbackWeights = useMemo(
    () => deriveWeights(feedbackEntries, rulesById),
    [feedbackEntries, rulesById],
  );

  const rankedBaseRegulations = useMemo(
    () =>
      profile
        ? rankRegulations(baseRegulations, profile, feedbackWeights)
        : [],
    [baseRegulations, feedbackWeights, profile],
  );

  const rankedSearchResults = useMemo(
    () =>
      profile && searchResults
        ? rankRegulations(searchResults, profile, feedbackWeights)
        : null,
    [feedbackWeights, profile, searchResults],
  );

  const stateName = profile ? US_STATE_NAMES[profile.state] : undefined;
  const stateCodes = useMemo(
    () =>
      profile
        ? Array.from(
            new Set([
              profile.state,
              ...(profile.additionalStates ?? []).filter(Boolean),
            ]),
          )
        : [],
    [profile],
  );
  const filtersActive = isAnyFilterActive(filters);
  const topicCount = profile?.topics.length ?? 0;

  const displayed = useMemo(() => {
    const pool =
      rankedSearchResults !== null ? rankedSearchResults : rankedBaseRegulations;
    let out = pool;
    if (filtersActive) {
      out = applyFilters(out, filters, topicCount, stateCodes);
    } else if (rankedSearchResults === null) {
      // Default ranked feed: only show rules that scored against the profile.
      out = out.filter((r) => r.baseScore > 0);
    }
    return out;
  }, [
    rankedSearchResults,
    rankedBaseRegulations,
    filters,
    filtersActive,
    topicCount,
    stateCodes,
  ]);

  // Reset pagination whenever the displayed pool's identity changes
  // (search query, filter state, or new base load).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, filters, baseRegulations]);

  const visibleRegs = useMemo(
    () => displayed.slice(0, visibleCount),
    [displayed, visibleCount],
  );
  const remaining = displayed.length - visibleRegs.length;

  // Filter options derived from the current pool (pre-filter)
  const filterPool =
    rankedSearchResults !== null ? rankedSearchResults : rankedBaseRegulations;
  const agencyOptions = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const r of filterPool) {
      const cur = counts.get(r.agencyId);
      if (cur) cur.count++;
      else counts.set(r.agencyId, { name: r.agencyName, count: 1 });
    }
    return Array.from(counts.entries())
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count);
  }, [filterPool]);

  const topicOptions = useMemo(() => {
    const counts = new Map<Topic, number>();
    for (const r of filterPool) {
      for (const t of r.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return ALL_TOPICS.filter((t) => counts.has(t)).map((t) => ({
      topic: t,
      count: counts.get(t) ?? 0,
    }));
  }, [filterPool]);

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  const stateLabel = stateName ?? profile.state;
  const isSearching = debouncedQuery.length > 0;

  return (
    <main className="min-h-screen">
      <FeedHeader query={searchQuery} onQueryChange={setSearchQuery} />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-2"
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {isSearching
              ? `Search · "${debouncedQuery}"`
              : filtersActive
                ? "Filtered view"
                : "Personalized for you"}
          </span>
          <h1 className="headline text-4xl md:text-[3.25rem]">
            {isSearching ? (
              <>
                Federal rules matching <em className="italic">"{debouncedQuery}"</em>.
              </>
            ) : (
              <>
                Open rules that affect <em className="italic">you</em> in {stateLabel}.
              </>
            )}
          </h1>
          <p className="max-w-2xl text-base text-ink-600">
            {isSearching ? (
              searchSource === "fallback" ? (
                <>
                  Showing fuzzy matches from your loaded feed pool. The federal
                  index uses strict whole-word matching, so try a shorter
                  keyword (e.g. <span className="text-ink">"health"</span>{" "}
                  instead of <span className="text-ink">"healthcare"</span>) to
                  reach the full database.
                </>
              ) : (
                <>Live results from regulations.gov, ranked against your profile.</>
              )
            ) : filtersActive ? (
              <>
                Filtered view. Clear filters to see your personalized ranking.
              </>
            ) : (
              <>
                Filtered from regulations.gov against your profile.{" "}
                <span className="text-ink">{profile.topics.join(", ")}</span>.
                Ranked by direct relevance, not by what's loudest.
              </>
            )}
          </p>
        </motion.div>

        <div className="flex gap-10">
          <div className="min-w-0 flex-1 space-y-5">
            {(loading || searching) ? (
              <>
                <RegulationCardSkeleton />
                <RegulationCardSkeleton />
                <RegulationCardSkeleton />
                <RegulationCardSkeleton />
              </>
            ) : displayed.length === 0 ? (
              <div className="rounded-2xl border border-rule bg-paper p-10 text-center">
                <p className="font-display text-2xl">
                  {isSearching
                    ? `No rules matched "${debouncedQuery}".`
                    : filtersActive
                      ? "No rules match your filters."
                      : errored
                        ? "We couldn't reach regulations.gov."
                        : "Nothing open right now."}
                </p>
                <p className="mt-2 text-ink-600">
                  {isSearching
                    ? "Try a different keyword, or clear the search to see your personalized feed."
                    : filtersActive
                      ? "Loosen or reset your filters in the right rail."
                      : errored
                        ? "The federal docket API is rate-limiting or down. Try again in a minute."
                        : "Try widening your topics in your profile, or check back tomorrow."}
                </p>
              </div>
            ) : (
              <>
                {visibleRegs.map((reg, i) => (
                  <RegulationCard
                    key={reg.id}
                    reg={reg}
                    topicCount={profile.topics.length}
                    index={i}
                    saved={isSaved(reg.id)}
                    commented={isCommented(reg.id)}
                    onToggleSaved={toggleSaved}
                    signal={feedback.get(reg.id) ?? null}
                    onSetSignal={(signal) => setRankingSignal(reg.id, signal)}
                  />
                ))}
                {remaining > 0 && (
                  <div className="flex justify-center pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((n) => n + PAGE_SIZE)
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-5 py-2.5 text-sm font-medium text-ink hover:border-ink/40 hover:shadow-card"
                    >
                      Show more
                      <span className="font-mono text-xs text-muted">
                        {remaining} remaining
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
            {!loading &&
              !searching &&
              displayed.length > 0 &&
              remaining === 0 &&
              !isSearching &&
              !filtersActive && (
                <p className="pt-6 text-center text-xs text-muted">
                  You've reached the end of today's feed. Check back tomorrow.
                  Agencies post new rules every weekday.
                </p>
              )}
          </div>

          <aside className="hidden w-72 flex-shrink-0 space-y-6 lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-6 overflow-y-auto pr-1">
              <FilterRail
                filters={filters}
                onChange={setFilters}
                agencyOptions={agencyOptions}
                topicOptions={topicOptions}
                stateLabel={stateLabel}
              />
              <TrendingRail regulations={displayed} source={source} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
