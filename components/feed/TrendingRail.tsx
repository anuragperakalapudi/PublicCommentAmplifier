"use client";

import type { ScoredRegulation } from "@/lib/types";
import { TrendingUp, MapPin, Filter } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";

const STATE_NAMES: Record<string, string> = {
  CA: "California", NY: "New York", TX: "Texas", FL: "Florida", OH: "Ohio",
  MI: "Michigan", PA: "Pennsylvania", IL: "Illinois", WA: "Washington",
};

export function TrendingRail({
  regulations,
  source,
}: {
  regulations: ScoredRegulation[];
  source: string;
}) {
  const { profile } = useProfile();

  const agencyCounts = regulations.reduce<Record<string, number>>((acc, r) => {
    acc[r.agencyId] = (acc[r.agencyId] ?? 0) + 1;
    return acc;
  }, {});

  const topAgencies = Object.entries(agencyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stateLabel = profile?.state
    ? STATE_NAMES[profile.state] ?? profile.state
    : "your state";

  return (
    <aside className="hidden w-72 flex-shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <section className="rounded-xl border border-rule bg-paper p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted">
            <TrendingUp className="h-3.5 w-3.5" /> Active right now
          </div>
          <p className="font-display mt-3 text-3xl text-ink">
            1,243
          </p>
          <p className="mt-1 text-sm text-ink-600">
            open federal comment periods on{" "}
            <span className="text-ink">regulations.gov</span> today
          </p>
          <div className="dotted-divider my-4" />
          <div className="flex items-center gap-2 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5" />
            Tied to {stateLabel}: <span className="text-ink">87</span>
          </div>
        </section>

        <section className="rounded-xl border border-rule bg-paper p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted">
              <Filter className="h-3.5 w-3.5" /> Your filters
            </div>
            <button className="text-xs text-accent hover:underline">Edit</button>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {profile?.topics.map((t) => (
              <li key={t} className="flex items-center justify-between">
                <span className="text-ink">{t}</span>
                <span className="text-xs text-muted">on</span>
              </li>
            ))}
            {!profile?.topics.length && (
              <li className="text-sm text-muted">No filters yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-rule bg-paper p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted">
            Top agencies in your feed
          </div>
          <ul className="mt-3 space-y-2">
            {topAgencies.map(([id, count]) => (
              <li
                key={id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-ink">
                  {id}
                </span>
                <span className="text-muted">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="px-2 text-[11px] leading-relaxed text-muted">
          Source: regulations.gov v4 ·{" "}
          <span className="text-ink-600">
            {source === "api"
              ? "live · URL-validated"
              : source === "error"
              ? "unavailable"
              : "—"}
          </span>{" "}
          · cached 5 min
        </p>
      </div>
    </aside>
  );
}
