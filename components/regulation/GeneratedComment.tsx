"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import type { Regulation, UserProfile } from "@/lib/types";
import { buildComment, commentWordCount } from "@/lib/mock/commentTemplates";
import { CopyButton } from "./CopyButton";
import { useCommentedRegulations } from "@/hooks/useCommentedRegulations";

type Variant = "balanced" | "shorter" | "personal";
const VARIANTS: { id: Variant; label: string; hint: string }[] = [
  { id: "balanced", label: "Balanced", hint: "Default — civic, substantive" },
  { id: "shorter", label: "Shorter", hint: "Tighter — straight to the ask" },
  { id: "personal", label: "More personal", hint: "Leans into your story" },
];

export function GeneratedComment({
  reg,
  profile,
}: {
  reg: Regulation;
  profile: UserProfile;
}) {
  const [variant, setVariant] = useState<Variant>("balanced");
  const [generating, setGenerating] = useState(false);
  const { isCommented, mark, unmark, commented } = useCommentedRegulations();
  const [showMarkUI, setShowMarkUI] = useState(false);
  const [pasteback, setPasteback] = useState("");

  const text = useMemo(() => buildComment(reg, profile, variant), [
    reg,
    profile,
    variant,
  ]);
  const words = commentWordCount(text);

  const switchVariant = (v: Variant) => {
    if (v === variant) return;
    setGenerating(true);
    setTimeout(() => {
      setVariant(v);
      setGenerating(false);
    }, 380);
  };

  const submittedEntry = commented.get(reg.id);
  const wasCommented = isCommented(reg.id);

  const handleMark = async (withPasteback: boolean) => {
    await mark(reg.id, withPasteback ? pasteback.trim() || null : null);
    setShowMarkUI(false);
    setPasteback("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          Drafted for you
        </div>
        <CopyButton text={text} />
      </div>

      <div className="document-paper relative rounded-xl p-7">
        {/* Tonal selector */}
        <div className="-mx-2 mb-5 flex flex-wrap items-center gap-2">
          {VARIANTS.map((v) => {
            const active = v.id === variant;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => switchVariant(v.id)}
                title={v.hint}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "border-ink bg-ink text-cream-50"
                    : "border-rule bg-paper text-ink-600 hover:border-ink/40"
                }`}
              >
                {active && <RefreshCw className="h-3 w-3" />}
                {v.label}
              </button>
            );
          })}
          <span className="ml-auto text-[11px] uppercase tracking-widest text-muted">
            Editable on regulations.gov
          </span>
        </div>

        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
              <div className="skeleton h-4 w-9/12" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-10/12" />
              <p className="pt-2 text-xs italic text-muted">
                Re-anchoring to your profile…
              </p>
            </motion.div>
          ) : (
            <motion.pre
              key={variant}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="font-display whitespace-pre-wrap text-[16px] leading-[1.75] text-ink-900"
              style={{ fontFeatureSettings: '"ss01" on' }}
            >
              {text}
            </motion.pre>
          )}
        </AnimatePresence>

        {/* corner watermark */}
        <div className="pointer-events-none absolute right-5 top-5 select-none font-mono text-[10px] uppercase tracking-widest text-muted/60">
          Draft v1 · {variant}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {words} words · ~{Math.max(1, Math.round(words / 220))} min read
        </span>
        <span className="italic">
          We don&rsquo;t submit for you. You stay in control.
        </span>
      </div>

      {/* "I submitted this" UI */}
      <div className="rounded-xl border border-rule bg-paper p-5">
        {wasCommented ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-forest">
              <CheckCircle2 className="h-4 w-4" />
              You marked this as commented on{" "}
              {submittedEntry
                ? new Date(submittedEntry.markedAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )
                : "today"}
              .
            </span>
            <button
              type="button"
              onClick={() => unmark(reg.id)}
              className="ml-auto text-xs text-muted hover:text-ink hover:underline"
            >
              Undo
            </button>
          </div>
        ) : showMarkUI ? (
          <div className="space-y-3">
            <p className="text-sm text-ink">
              Optionally paste the final text you actually submitted, in case
              you edited heavily.
            </p>
            <textarea
              value={pasteback}
              onChange={(e) => setPasteback(e.target.value)}
              placeholder="Paste your final submitted text here (optional)…"
              className="w-full rounded-md border border-rule bg-cream-50 px-3 py-2 font-mono text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              rows={4}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleMark(true)}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-medium text-cream-50 hover:bg-forest-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save text & mark as commented
              </button>
              <button
                type="button"
                onClick={() => handleMark(false)}
                className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-xs font-medium text-ink hover:border-ink/40"
              >
                Skip — just mark as commented
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMarkUI(false);
                  setPasteback("");
                }}
                className="ml-auto text-xs text-muted hover:text-ink hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink">
              Already submitted this comment on regulations.gov?
            </span>
            <button
              type="button"
              onClick={() => setShowMarkUI(true)}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-cream-50 hover:bg-ink-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              I submitted this
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
