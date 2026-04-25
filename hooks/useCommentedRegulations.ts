"use client";

import { useCallback, useEffect, useState } from "react";

const LS_KEY = "pca:commented:v1";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export interface CommentedEntry {
  documentId: string;
  markedAt: string;
  commentText: string | null;
}

function lsLoad(): CommentedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as CommentedEntry[]) : [];
  } catch {
    return [];
  }
}

function lsSave(entries: CommentedEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

interface UseCommentedRegulations {
  commented: Map<string, CommentedEntry>;
  hydrated: boolean;
  isCommented: (documentId: string) => boolean;
  mark: (documentId: string, commentText?: string | null) => Promise<void>;
  unmark: (documentId: string) => Promise<void>;
  list: () => CommentedEntry[];
}

export function useCommentedRegulations(): UseCommentedRegulations {
  const [entries, setEntries] = useState<CommentedEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isClerkConfigured) {
        try {
          const r = await fetch("/api/commented");
          if (r.ok) {
            const json = (await r.json()) as { commented: CommentedEntry[] };
            if (!cancelled) {
              setEntries(json.commented);
              lsSave(json.commented);
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

  const map = new Map(entries.map((e) => [e.documentId, e]));

  const isCommented = useCallback(
    (id: string) => map.has(id),
    // map is recreated each render but its content is from `entries`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries],
  );

  const mark = useCallback(
    async (documentId: string, commentText: string | null = null) => {
      const newEntry: CommentedEntry = {
        documentId,
        markedAt: new Date().toISOString(),
        commentText,
      };
      const next = [
        newEntry,
        ...entries.filter((e) => e.documentId !== documentId),
      ];
      setEntries(next);
      lsSave(next);

      if (!isClerkConfigured) return;
      try {
        await fetch("/api/commented", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, commentText }),
        });
      } catch {
        // Local state already updated.
      }
    },
    [entries],
  );

  const unmark = useCallback(
    async (documentId: string) => {
      const next = entries.filter((e) => e.documentId !== documentId);
      setEntries(next);
      lsSave(next);
      if (!isClerkConfigured) return;
      try {
        await fetch("/api/commented", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });
      } catch {
        // ignore
      }
    },
    [entries],
  );

  const list = useCallback(() => entries, [entries]);

  return { commented: map, hydrated, isCommented, mark, unmark, list };
}
