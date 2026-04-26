"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import type { ScoredRegulation } from "@/lib/types";
import { formatDeadline, matchPercent } from "@/lib/ranking";
import { AgencyBadge } from "@/components/shared/AgencyBadge";

export function RegulationCard({
  reg,
  topicCount,
  index,
  saved,
  commented,
  onToggleSaved,
}: {
  reg: ScoredRegulation;
  topicCount: number;
  index: number;
  saved: boolean;
  commented: boolean;
  onToggleSaved: (documentId: string) => void;
}) {
  const pct = matchPercent(reg.score, topicCount);
  const deadline = formatDeadline(reg.commentEndDate);
  const closingSoon =
    deadline.includes("today") ||
    deadline.includes("tomorrow") ||
    /Closes in (\d+) days/.test(deadline) &&
      Number(deadline.match(/(\d+)/)?.[1] ?? 99) <= 7;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSaved(reg.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.04, 0.35),
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      <Link
        href={`/regulation/${encodeURIComponent(reg.id)}`}
        className="group block rounded-2xl border border-rule bg-paper p-7 shadow-card transition hover:border-ink/20 hover:shadow-cardHover"
      >
        <div className="flex flex-wrap items-center gap-3">
          <AgencyBadge agencyId={reg.agencyId} agencyName={reg.agencyName} />
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            {reg.documentType}
          </span>
          <span className="text-xs text-muted">·</span>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              closingSoon ? "text-accent" : "text-muted"
            }`}
          >
            <Clock className="h-3 w-3" />
            {deadline}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {commented && (
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-1 text-xs font-medium text-forest">
                <CheckCircle2 className="h-3 w-3" />
                Commented
              </span>
            )}
            {reg.matchedTopics.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest">
                <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                {pct}% match
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveClick}
              aria-pressed={saved}
              aria-label={saved ? "Unsave rule" : "Save rule"}
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                saved
                  ? "border-accent bg-accent text-cream-50"
                  : "border-rule bg-paper text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              {saved ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <h2 className="font-display mt-4 text-2xl leading-snug text-ink transition group-hover:text-ink-900 md:text-[1.6rem]">
          {reg.title}
        </h2>

        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink-600">
          {reg.summary}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {reg.matchedTopics.slice(0, 3).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
            {reg.matchedTopics.length === 0 &&
              reg.topics.slice(0, 2).map((t) => (
                <span key={t} className="chip opacity-70">
                  {t}
                </span>
              ))}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition group-hover:gap-2">
            Read & comment
            <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export function RegulationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-rule bg-paper p-7 shadow-card">
      <div className="flex items-center gap-3">
        <div className="skeleton h-5 w-12" />
        <div className="skeleton h-3 w-24" />
        <div className="skeleton ml-auto h-5 w-20" />
      </div>
      <div className="skeleton mt-5 h-7 w-11/12" />
      <div className="skeleton mt-2 h-7 w-9/12" />
      <div className="skeleton mt-5 h-4 w-full" />
      <div className="skeleton mt-2 h-4 w-10/12" />
      <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-16" />
          <div className="skeleton h-5 w-16" />
        </div>
        <div className="skeleton h-4 w-28" />
      </div>
    </div>
  );
}
