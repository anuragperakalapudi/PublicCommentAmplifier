"use client";

import { useCallback, useEffect, useState } from "react";

const LS_KEY = "pca:saved:v1";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function lsLoad(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function lsSave(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

interface UseSavedRegulations {
  saved: Set<string>;
  hydrated: boolean;
  isSaved: (documentId: string) => boolean;
  toggle: (documentId: string) => Promise<void>;
}

export function useSavedRegulations(): UseSavedRegulations {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Try server first when configured.
      if (isClerkConfigured) {
        try {
          const r = await fetch("/api/saved");
          if (r.ok) {
            const json = (await r.json()) as { saved: string[] };
            if (!cancelled) {
              const set = new Set(json.saved);
              setSaved(set);
              lsSave(json.saved);
              setHydrated(true);
              return;
            }
          }
        } catch {
          // fall through
        }
      }
      if (cancelled) return;
      setSaved(new Set(lsLoad()));
      setHydrated(true);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved = useCallback(
    (id: string) => saved.has(id),
    [saved],
  );

  const toggle = useCallback(
    async (documentId: string) => {
      const wasSaved = saved.has(documentId);
      const next = new Set(saved);
      if (wasSaved) next.delete(documentId);
      else next.add(documentId);
      setSaved(next);
      lsSave(Array.from(next));

      if (!isClerkConfigured) return;

      try {
        await fetch("/api/saved", {
          method: wasSaved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });
      } catch {
        // Revert on network error.
        const reverted = new Set(saved);
        setSaved(reverted);
        lsSave(Array.from(reverted));
      }
    },
    [saved],
  );

  return { saved, hydrated, isSaved, toggle };
}
