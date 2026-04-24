"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { rankRegulations } from "@/lib/ranking";
import { MOCK_REGULATIONS } from "@/lib/mock/regulations";
import type { Regulation, ScoredRegulation } from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";
import {
  RegulationCard,
  RegulationCardSkeleton,
} from "@/components/feed/RegulationCard";
import { TrendingRail } from "@/components/feed/TrendingRail";

const STATE_NAMES: Record<string, string> = {
  CA: "California", NY: "New York", TX: "Texas", FL: "Florida", OH: "Ohio",
  MI: "Michigan", PA: "Pennsylvania", IL: "Illinois", WA: "Washington",
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NC: "North Carolina", ND: "North Dakota", OK: "Oklahoma", OR: "Oregon",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "the District of Columbia",
};

export default function FeedPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const [loading, setLoading] = useState(true);
  const [regulations, setRegulations] = useState<ScoredRegulation[]>([]);
  const [source, setSource] = useState<string>("");

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (hydrated && !profile) {
      router.replace("/onboarding");
    }
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    const topicsParam = encodeURIComponent(profile.topics.join(","));

    fetch(`/api/regulations?topics=${topicsParam}`)
      .then(async (r) => {
        const json = (await r.json()) as {
          regulations: Regulation[];
          source: string;
        };
        if (cancelled) return;
        const ranked = rankRegulations(json.regulations, profile);
        setRegulations(ranked);
        setSource(json.source);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const ranked = rankRegulations(MOCK_REGULATIONS, profile);
        setRegulations(ranked);
        setSource("mock");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  const stateName = STATE_NAMES[profile.state] ?? profile.state;
  const topMatch = regulations[0];
  const topMatchPct = topMatch
    ? Math.min(99, 70 + (topMatch.matchedTopics.length * 8))
    : 0;

  return (
    <main className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-2"
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Personalized for you
          </span>
          <h1 className="headline text-4xl md:text-[3.25rem]">
            Open rules that affect <em className="italic">you</em> in {stateName}.
          </h1>
          <p className="max-w-2xl text-base text-ink-600">
            Filtered from regulations.gov against your profile —{" "}
            <span className="text-ink">{profile.topics.join(", ")}</span>. Ranked
            by direct relevance, not by what's loudest.
          </p>
        </motion.div>

        <div className="flex gap-10">
          <div className="min-w-0 flex-1 space-y-5">
            {loading ? (
              <>
                <RegulationCardSkeleton />
                <RegulationCardSkeleton />
                <RegulationCardSkeleton />
                <RegulationCardSkeleton />
              </>
            ) : regulations.length === 0 ? (
              <div className="rounded-2xl border border-rule bg-paper p-10 text-center">
                <p className="font-display text-2xl">Nothing open right now.</p>
                <p className="mt-2 text-ink-600">
                  Try widening your topics in your profile.
                </p>
              </div>
            ) : (
              regulations.map((reg, i) => (
                <RegulationCard
                  key={reg.id}
                  reg={reg}
                  topicCount={profile.topics.length}
                  index={i}
                />
              ))
            )}
            {!loading && regulations.length > 0 && (
              <p className="pt-6 text-center text-xs text-muted">
                You've reached the end of today's feed. Check back tomorrow —
                agencies post new rules every weekday.
              </p>
            )}
          </div>

          <TrendingRail regulations={regulations} source={source} />
        </div>
      </section>
    </main>
  );
}
