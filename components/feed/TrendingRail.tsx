"use client";

import type { ScoredRegulation } from "@/lib/types";
import { agencyDisplayName } from "@/lib/regulationsApi";

export function TrendingRail({
  regulations,
  source,
}: {
  regulations: ScoredRegulation[];
  source: string;
}) {
  const agencyCounts = regulations.reduce<Record<string, number>>((acc, r) => {
    acc[r.agencyId] = (acc[r.agencyId] ?? 0) + 1;
    return acc;
  }, {});

  const topAgencies = Object.entries(agencyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section className="rounded-xl border border-rule bg-paper p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted">
        Top agencies in your feed
      </div>
      <ul className="mt-3 space-y-2">
        {topAgencies.length === 0 && (
          <li className="text-xs text-muted">Feed is empty.</li>
        )}
        {topAgencies.map(([id, count]) => (
          <li
            key={id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-ink">
              {id}
            </span>
            <span
              className="flex-1 truncate text-xs text-muted"
              title={agencyDisplayName(id)}
            >
              {agencyDisplayName(id)}
            </span>
            <span className="font-mono text-xs text-muted">{count}</span>
          </li>
        ))}
      </ul>

      <p className="dotted-divider my-4" />

      <p className="text-[11px] leading-relaxed text-muted">
        Federal docket data:{" "}
        <span className="text-ink-600">
          {source === "api"
            ? "live"
            : source === "error"
              ? "unavailable"
              : "not loaded"}
        </span>
        . Cached for 5 min.
      </p>
    </section>
  );
}
