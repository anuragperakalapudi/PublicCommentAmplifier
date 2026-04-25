"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Mail, ShieldCheck, User2, Trash2, Bookmark, Activity,
} from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { FeedHeader } from "@/components/feed/FeedHeader";

const SECTIONS = [
  {
    href: "/settings/profile",
    icon: User2,
    title: "Profile",
    body: "Edit your demographics, occupation, state, and topic interests.",
  },
  {
    href: "/settings/email",
    icon: Mail,
    title: "Email preferences",
    body: "Control digest frequency, closing-soon alerts, and topic mutes.",
  },
  {
    href: "/settings/privacy",
    icon: ShieldCheck,
    title: "Privacy & data",
    body: "See what we know about you, export, or delete your account.",
  },
  {
    href: "/saved",
    icon: Bookmark,
    title: "Saved rules",
    body: "Your bookmarked rules sorted by closing deadline.",
  },
  {
    href: "/activity",
    icon: Activity,
    title: "My activity",
    body: "Comments you marked submitted and saved-then-closed events.",
  },
] as const;

export default function SettingsHubPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) {
    return (
      <main className="min-h-screen">
        <FeedHeader />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <FeedHeader />

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent">
            Settings
          </span>
          <h1 className="headline text-4xl md:text-5xl">
            Your account.
          </h1>
        </div>

        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-center gap-5 rounded-xl border border-rule bg-paper p-5 transition hover:border-ink/20 hover:shadow-card"
            >
              <s.icon className="h-5 w-5 flex-shrink-0 text-accent" />
              <div className="flex-1">
                <p className="font-display text-lg text-ink">{s.title}</p>
                <p className="mt-1 text-sm text-ink-600">{s.body}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-rule bg-cream-50 p-5 text-sm text-ink-600">
          <p className="flex items-start gap-3">
            <Trash2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
            <span>
              Want to delete everything? Visit{" "}
              <Link href="/settings/privacy" className="text-accent hover:underline">
                Privacy &amp; data
              </Link>{" "}
              for a one-click account delete.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
