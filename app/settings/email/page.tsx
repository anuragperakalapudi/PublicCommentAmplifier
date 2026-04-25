"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { ALL_TOPICS, type Topic } from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const PREFS_LS_KEY = "pca:emailPrefs:v1";

interface EmailPrefs {
  digestFrequency: "daily" | "weekly" | "off";
  digestTime: string;
  timezone: string;
  closingSoonAlerts: boolean;
  finalRuleAlerts: boolean;
  mutedTopics: string[];
}

const DEFAULT_PREFS: EmailPrefs = {
  digestFrequency: "weekly",
  digestTime: "09:00",
  timezone: "America/New_York",
  closingSoonAlerts: true,
  finalRuleAlerts: true,
  mutedTopics: [],
};

const FREQ_OPTIONS = [
  { id: "weekly", label: "Weekly" },
  { id: "daily", label: "Daily" },
  { id: "off", label: "Off" },
] as const;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export default function SettingsEmailPage() {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_PREFS);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  // Load prefs (server first, localStorage fallback)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (isClerkConfigured) {
        try {
          const r = await fetch("/api/email-preferences");
          if (r.ok) {
            const json = (await r.json()) as { prefs: EmailPrefs };
            if (!cancelled) {
              setPrefs(json.prefs);
              window.localStorage.setItem(
                PREFS_LS_KEY,
                JSON.stringify(json.prefs),
              );
              return;
            }
          }
        } catch {
          // fall through
        }
      }
      if (cancelled) return;
      const raw = window.localStorage.getItem(PREFS_LS_KEY);
      if (raw) {
        try {
          setPrefs(JSON.parse(raw) as EmailPrefs);
        } catch {
          /* keep default */
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    window.localStorage.setItem(PREFS_LS_KEY, JSON.stringify(prefs));
    if (isClerkConfigured) {
      try {
        await fetch("/api/email-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prefs }),
        });
      } catch {
        // local already saved
      }
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const toggleMuted = (t: Topic) =>
    setPrefs((p) => ({
      ...p,
      mutedTopics: p.mutedTopics.includes(t)
        ? p.mutedTopics.filter((x) => x !== t)
        : [...p.mutedTopics, t],
    }));

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

      <section className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to settings
        </Link>

        <h1 className="headline mt-6 text-4xl">Email preferences</h1>
        <p className="mt-3 text-base text-ink-600">
          We&rsquo;re saving your preferences now. Email sending lands in a
          later phase. You&rsquo;ll never get more than 3 emails in any 7-day
          window unless you opt into the daily digest.
        </p>

        <div className="mt-10 space-y-8">
          <fieldset>
            <legend className="text-sm font-medium text-ink">Digest frequency</legend>
            <div className="mt-3 flex gap-2">
              {FREQ_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() =>
                    setPrefs((p) => ({ ...p, digestFrequency: o.id }))
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    prefs.digestFrequency === o.id
                      ? "border-ink bg-ink text-cream-50"
                      : "border-rule bg-paper text-ink hover:border-ink/40"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-ink">Delivery time</span>
              <input
                type="time"
                value={prefs.digestTime}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, digestTime: e.target.value }))
                }
                className="mt-2 w-full rounded-md border border-rule bg-paper px-3 py-2 text-ink focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink">Timezone</span>
              <select
                value={prefs.timezone}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, timezone: e.target.value }))
                }
                className="mt-2 w-full rounded-md border border-rule bg-paper px-3 py-2 text-ink focus:border-accent focus:outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ToggleRow
            label="Closing-soon alerts"
            hint="A reminder 7, 3, and 1 days before a saved rule closes."
            checked={prefs.closingSoonAlerts}
            onChange={(v) =>
              setPrefs((p) => ({ ...p, closingSoonAlerts: v }))
            }
          />
          <ToggleRow
            label="Final-rule alerts"
            hint="Email when an agency posts the final version of a rule you engaged with."
            checked={prefs.finalRuleAlerts}
            onChange={(v) => setPrefs((p) => ({ ...p, finalRuleAlerts: v }))}
          />

          <fieldset>
            <legend className="text-sm font-medium text-ink">
              Mute topics from the digest
            </legend>
            <p className="mt-1 text-xs text-muted">
              Selected topics still appear in your feed; they just won&rsquo;t
              show up in email digests.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALL_TOPICS.map((t) => {
                const muted = prefs.mutedTopics.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleMuted(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      muted
                        ? "border-accent bg-accent text-cream-50"
                        : "border-rule bg-paper text-ink hover:border-ink/40"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-10 flex items-center justify-end border-t border-rule pt-6">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream-50 shadow-card hover:bg-accent-700"
          >
            <Check className="h-4 w-4" />
            {savedFlash ? "Saved ✓" : "Save preferences"}
          </button>
        </div>
      </section>
    </main>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-xl border border-rule bg-paper p-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={`Toggle ${label}`}
        className={`mt-1 h-6 w-11 flex-shrink-0 rounded-full border transition ${
          checked ? "border-ink bg-ink" : "border-rule bg-cream-100"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-cream-50 shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
