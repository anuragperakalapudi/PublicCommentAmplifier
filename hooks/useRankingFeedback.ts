"use client";

import { useCallback, useEffect, useState } from "react";
import type { RankingSignal } from "@/lib/types";

const LS_KEY = "pca:ranking-feedback:v1";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function lsLoad(): Record<string, RankingSignal> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RankingSignal>) : {};
  } catch {
    return {};
  }
}

function lsSave(feedback: Record<string, RankingSignal>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(feedback));
}

interface UseRankingFeedback {
  feedback: Map<string, RankingSignal>;
  hydrated: boolean;
  set: (documentId: string, signal: RankingSignal | null) => Promise<void>;
}

export function useRankingFeedback(): UseRankingFeedback {
  const [entries, setEntries] = useState<Record<string, RankingSignal>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isClerkConfigured) {
        try {
          const r = await fetch("/api/ranking-feedback");
          if (r.ok) {
            const json = (await r.json()) as {
              feedback: Record<string, RankingSignal>;
            };
            if (!cancelled) {
              setEntries(json.feedback);
              lsSave(json.feedback);
              setHydrated(true);
              return;
            }
          }
        } catch {
          // fall through
        }
      }
      if (cancelled) return;
      setEntries(lsLoad());
      setHydrated(true);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback(
    async (documentId: string, signal: RankingSignal | null) => {
      const next = { ...entries };
      if (signal) next[documentId] = signal;
      else delete next[documentId];
      setEntries(next);
      lsSave(next);

      if (!isClerkConfigured) return;
      try {
        await fetch("/api/ranking-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, signal }),
        });
      } catch {
        setEntries(entries);
        lsSave(entries);
      }
    },
    [entries],
  );

  return {
    feedback: new Map(Object.entries(entries)),
    hydrated,
    set,
  };
}
