"use client";

import { Search, Settings2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { useProfile } from "@/context/ProfileContext";

interface FeedHeaderProps {
  query?: string;
  onQueryChange?: (q: string) => void;
}

export function FeedHeader({ query = "", onQueryChange }: FeedHeaderProps) {
  const { profile } = useProfile();
  const initials = profile?.occupation
    ? profile.occupation
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "PC";

  const interactive = typeof onQueryChange === "function";

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-cream-100/85 backdrop-blur supports-[backdrop-filter]:bg-cream-100/70">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Logo />
        <div className="relative ml-4 hidden flex-1 items-center md:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange?.(e.target.value)}
            placeholder="Search open federal rules…"
            readOnly={!interactive}
            className="w-full rounded-full border border-rule bg-paper px-10 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {query && interactive && (
            <button
              type="button"
              onClick={() => onQueryChange?.("")}
              className="absolute right-3 text-[11px] uppercase tracking-widest text-muted hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden md:inline">Edit profile</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-xs font-medium text-cream-50">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
