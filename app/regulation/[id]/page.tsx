"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, FileText, Clock, Sparkles,
  Bookmark, BookmarkCheck, CheckCircle2,
} from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import type { Regulation } from "@/lib/types";
import { formatDeadline, daysUntil } from "@/lib/ranking";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { AgencyBadge } from "@/components/shared/AgencyBadge";
import { GeneratedComment } from "@/components/regulation/GeneratedComment";
import { useSavedRegulations } from "@/hooks/useSavedRegulations";
import { useCommentedRegulations } from "@/hooks/useCommentedRegulations";

export default function RegulationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const decodedId = useMemo(
    () => decodeURIComponent(params?.id ?? ""),
    [params?.id],
  );

  const [reg, setReg] = useState<Regulation | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggle: toggleSaved } = useSavedRegulations();
  const { isCommented } = useCommentedRegulations();

  // LLM summary state
  const [longSummary, setLongSummary] = useState<string | null>(null);
  const [keyProvisions, setKeyProvisions] = useState<string[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [whyText, setWhyText] = useState<string | null>(null);
  const [whyCitations, setWhyCitations] = useState<Array<{ title: string }>>([]);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace("/onboarding");
    }
  }, [hydrated, profile, router]);

  useEffect(() => {
    if (!profile || !decodedId) return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/regulations`)
      .then(async (r) => {
        const json = (await r.json()) as { regulations: Regulation[] };
        if (cancelled) return;
        setReg(json.regulations.find((r) => r.id === decodedId) ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setReg(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile, decodedId]);

  // LLM summary + provisions
  useEffect(() => {
    if (!reg) return;
    let cancelled = false;
    setSummaryLoading(true);
    fetch(`/api/llm/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regulation: reg }),
    })
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) {
            setLongSummary(null);
            setKeyProvisions(null);
            setSummaryLoading(false);
          }
          return;
        }
        const json = (await r.json()) as {
          longSummary: string;
          keyProvisions: string[];
        };
        if (cancelled) return;
        setLongSummary(json.longSummary);
        setKeyProvisions(json.keyProvisions);
        setSummaryLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLongSummary(null);
        setKeyProvisions(null);
        setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reg]);

  // "Why in your feed": personalized, not server-cached
  useEffect(() => {
    if (!reg || !profile) return;
    let cancelled = false;
    const matchedTopics = reg.topics.filter((t) => profile.topics.includes(t));
    setWhyCitations([]);
    fetch(`/api/llm/why`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regulation: reg, profile, matchedTopics }),
    })
      .then(async (r) => {
        if (!r.ok) return;
        const json = (await r.json()) as {
          text: string;
          citations?: Array<{ title: string }>;
        };
        if (cancelled) return;
        setWhyText(json.text);
        setWhyCitations(json.citations ?? []);
      })
      .catch(() => {
        // silent: fall back to static text
      });
    return () => {
      cancelled = true;
    };
  }, [reg, profile]);

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton mt-6 h-12 w-2/3" />
          <div className="skeleton mt-3 h-12 w-1/2" />
          <div className="mt-10 grid gap-12 md:grid-cols-12">
            <div className="space-y-3 md:col-span-7">
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-5 w-9/12" />
            </div>
            <div className="md:col-span-5">
              <div className="skeleton h-72 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!reg) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="font-display text-3xl">We couldn't find that rule.</p>
          <p className="mt-3 text-ink-600">
            It may have closed for comment, or the docket ID changed.
          </p>
          <Link
            href="/feed"
            className="mt-6 inline-flex items-center gap-2 text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to feed
          </Link>
        </div>
      </main>
    );
  }

  const days = daysUntil(reg.commentEndDate);
  const closingSoon = days <= 7;

  return (
    <main className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>

        {/* Hero header */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 border-b border-rule pb-10"
        >
          <div className="flex flex-wrap items-center gap-3">
            <AgencyBadge
              agencyId={reg.agencyId}
              agencyName={reg.agencyName}
              size="md"
            />
            <span className="text-xs font-medium uppercase tracking-widest text-muted">
              {reg.documentType}
            </span>
            <span className="text-xs text-muted">·</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
              Docket {reg.id}
            </span>
            {reg.source === "mock" && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted">
                Curated demo entry
              </span>
            )}
          </div>

          <h1 className="headline mt-5 max-w-4xl text-[clamp(2rem,4vw,3.4rem)]">
            {reg.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 ${
                closingSoon ? "text-accent" : "text-ink-600"
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatDeadline(reg.commentEndDate)}
            </span>
            <span className="text-muted">
              Posted{" "}
              {new Date(reg.postedDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-muted">·</span>
            <span className="text-ink-600">{reg.agencyName}</span>

            <div className="ml-auto flex items-center gap-2">
              {isCommented(reg.id) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-medium text-forest">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Commented
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleSaved(reg.id)}
                aria-pressed={isSaved(reg.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                  isSaved(reg.id)
                    ? "border-accent bg-accent text-cream-50"
                    : "border-rule text-ink-600 hover:border-ink/30"
                }`}
              >
                {isSaved(reg.id) ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" /> Save
                  </>
                )}
              </button>
              <a
                href={reg.regulationsGovUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Mark in sessionStorage so we can prompt on return.
                  if (typeof window !== "undefined") {
                    window.sessionStorage.setItem(
                      `pca:visited:${reg.id}`,
                      String(Date.now()),
                    );
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream-50 shadow-card hover:bg-accent-700"
              >
                Open on regulations.gov
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.header>

        {/* Two-column body */}
        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          {/* Left: plain language + provisions + excerpt */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="space-y-10 lg:col-span-7"
          >
            <section>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                In plain language
              </h2>
              {summaryLoading && !longSummary ? (
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-5 w-full" />
                  <div className="skeleton h-5 w-11/12" />
                  <div className="skeleton h-5 w-9/12" />
                </div>
              ) : longSummary ? (
                <div className="font-display mt-3 space-y-4 text-[1.15rem] leading-[1.6] text-ink">
                  {longSummary.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <p className="font-display mt-3 text-[1.35rem] leading-[1.55] text-ink">
                  {reg.summary}
                </p>
              )}
            </section>

            {((keyProvisions && keyProvisions.length > 0) ||
              (reg.provisions && reg.provisions.length > 0)) && (
              <section>
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                  Key provisions
                </h2>
                <ul className="mt-4 space-y-3">
                  {(keyProvisions ?? reg.provisions ?? []).map((p, i) => (
                    <motion.li
                      key={`${i}-${p.slice(0, 24)}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex gap-3 rounded-lg border-l-2 border-accent bg-accent-50/40 px-4 py-3"
                    >
                      <span className="font-mono text-xs text-accent">
                        §{i + 1}
                      </span>
                      <span className="text-[15px] leading-snug text-ink">
                        {p}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </section>
            )}

            {reg.excerpt && (
              <section>
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted">
                  From the official document
                </h2>
                <blockquote className="font-display mt-4 border-l-2 border-rule pl-5 text-[1.05rem] italic leading-relaxed text-ink-600">
                  {reg.excerpt}
                </blockquote>
                <a
                  href={reg.regulationsGovUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <FileText className="h-4 w-4" /> Read the full notice on
                  regulations.gov
                </a>
              </section>
            )}

            <section className="rounded-xl border border-rule bg-paper p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-4 w-4 text-accent" />
                <div>
                  <h3 className="font-display text-lg">
                    Why this is in your feed
                  </h3>
                  {whyText ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {whyText}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      Matched to your interests in{" "}
                      <span className="text-ink">
                        {reg.topics
                          .filter((t) => profile.topics.includes(t))
                          .join(", ") || profile.topics[0]}
                      </span>
                      , your location in{" "}
                      <span className="text-ink">{profile.state}</span>, and
                      the proximity of the comment-period deadline.
                    </p>
                  )}
                  {whyCitations.length > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      Uses your story:{" "}
                      <span className="text-ink">
                        {whyCitations.map((c) => c.title).join(", ")}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </section>
          </motion.div>

          {/* Right: generated comment */}
          <motion.aside
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="lg:col-span-5"
          >
            <div className="lg:sticky lg:top-24">
              <GeneratedComment reg={reg} profile={profile} />

              <div className="mt-6 rounded-xl border border-dashed border-rule bg-cream-50/60 p-5 text-sm leading-relaxed text-ink-600">
                <p>
                  <span className="font-medium text-ink">
                    What to do with this:
                  </span>{" "}
                  Click <span className="text-accent">Copy comment</span>, then{" "}
                  <span className="text-accent">Open on regulations.gov</span>{" "}
                  ↗ to land directly on the federal comment box. Paste,
                  add anything else you want to say, and submit.
                </p>
                <a
                  href={reg.regulationsGovUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                >
                  Take me to the official comment box
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  );
}
