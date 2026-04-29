"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Regulation, UserProfile } from "@/lib/types";
import { buildComment, commentWordCount } from "@/lib/mock/commentTemplates";
import { CopyButton } from "./CopyButton";
import { useCommentedRegulations } from "@/hooks/useCommentedRegulations";

type Variant = "balanced" | "shorter" | "personal";
const VARIANTS: { id: Variant; label: string; hint: string }[] = [
  { id: "balanced", label: "Lead with policy", hint: "Civic, substantive, anchored in your stake" },
  { id: "shorter", label: "Lead with a question", hint: "Tighter, the question this raises for you" },
  { id: "personal", label: "Lead with story", hint: "Open with a vivid moment from your life" },
];

const isGeminiConfiguredClient =
  typeof process !== "undefined" &&
  // We can't read GEMINI_API_KEY on the client (server-only). Assume the
  // server is configured if the API responds 200; treat all non-2xx as
  // "show the fallback draft."
  true;

export function GeneratedComment({
  reg,
  profile,
}: {
  reg: Regulation;
  profile: UserProfile;
}) {
  const [variant, setVariant] = useState<Variant>("balanced");
  const [generating, setGenerating] = useState(true);
  const [llmText, setLlmText] = useState<string | null>(null);
  const [llmFlags, setLlmFlags] = useState<string[]>([]);
  const [llmFailed, setLlmFailed] = useState(false);
  const { isCommented, mark, unmark, commented } = useCommentedRegulations();
  const [showMarkUI, setShowMarkUI] = useState(false);
  const [pasteback, setPasteback] = useState("");

  // Synchronous fallback always available so we can render something
  // immediately while the AI draft is in flight.
  const fallbackText = useMemo(
    () => buildComment(reg, profile, variant),
    [reg, profile, variant],
  );

  const text = llmText ?? fallbackText;
  const words = commentWordCount(text);

  // Fetch AI draft on mount and when variant changes.
  useEffect(() => {
    if (!isGeminiConfiguredClient) return;
    let cancelled = false;
    setGenerating(true);
    setLlmFailed(false);
    setLlmFlags([]);

    fetch("/api/llm/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regulation: reg, profile, variant }),
    })
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) {
          // 501 (not configured) or 500 (error): fall back silently.
          setLlmText(null);
          setLlmFailed(r.status >= 500);
          setGenerating(false);
          return;
        }
        const json = (await r.json()) as {
          text: string;
          flags?: string[];
          ok?: boolean;
        };
        if (cancelled) return;
        setLlmText(json.text);
        setLlmFlags(json.flags ?? []);
        setGenerating(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLlmText(null);
        setLlmFailed(true);
        setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reg, profile, variant]);

  const switchVariant = (v: Variant) => {
    if (v === variant) return;
    setVariant(v);
    setLlmText(null); // clear so the fallback shows during regen
  };

  const submittedEntry = commented.get(reg.id);
  const wasCommented = isCommented(reg.id);

  const handleMark = async (withPasteback: boolean) => {
    await mark(reg.id, withPasteback ? pasteback.trim() || null : null);
    setShowMarkUI(false);
    setPasteback("");
  };

  const usingTemplate = llmText === null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          {usingTemplate
            ? generating
              ? "Drafting..."
              : "Draft ready"
            : "Drafted for you"}
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
                {active && generating && <RefreshCw className="h-3 w-3 animate-spin" />}
                {v.label}
              </button>
            );
          })}
          <span className="ml-auto text-[11px] uppercase tracking-widest text-muted">
            Editable on regulations.gov
          </span>
        </div>

        <AnimatePresence mode="wait">
          {generating && !text ? (
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
                Anchoring to your profile...
              </p>
            </motion.div>
          ) : (
            <motion.pre
              key={`${variant}-${usingTemplate ? "tmpl" : "llm"}`}
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

      {llmFlags.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent-50 p-3 text-xs text-ink-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
          <span>
            Heads up: this draft needs extra review before submitting. Flags:{" "}
            <code className="font-mono text-[10px]">{llmFlags.join(", ")}</code>
          </span>
        </div>
      )}

      {llmFailed && (
        <p className="text-xs italic text-muted">
          Draft service had trouble. Showing a fallback draft you can still edit.
        </p>
      )}

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
              placeholder="Paste your final submitted text here (optional)..."
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
                Skip and just mark as commented
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
