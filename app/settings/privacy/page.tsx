"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Trash2, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { FeedHeader } from "@/components/feed/FeedHeader";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SettingsPrivacyPage() {
  const router = useRouter();
  const { profile, hydrated, reset } = useProfile();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (hydrated && !profile) {
    router.replace("/onboarding");
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      // Try server-side export first.
      if (isClerkConfigured) {
        const r = await fetch("/api/account");
        if (r.ok) {
          const blob = await r.blob();
          downloadBlob(blob, `opencomment-export-${Date.now()}.json`);
          setExporting(false);
          return;
        }
      }
      // Fall back to a localStorage-only export.
      const local = {
        exportedAt: new Date().toISOString(),
        source: "localStorage",
        profile,
        saved: safeParse(window.localStorage.getItem("pca:saved:v1")),
        commented: safeParse(window.localStorage.getItem("pca:commented:v1")),
        emailPrefs: safeParse(window.localStorage.getItem("pca:emailPrefs:v1")),
      };
      const blob = new Blob([JSON.stringify(local, null, 2)], {
        type: "application/json",
      });
      downloadBlob(blob, `opencomment-export-${Date.now()}.json`);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (isClerkConfigured) {
        try {
          await fetch("/api/account", { method: "DELETE" });
        } catch {
          // proceed to local cleanup anyway
        }
      }
      // Always wipe localStorage.
      window.localStorage.removeItem("pca:profile:v1");
      window.localStorage.removeItem("pca:saved:v1");
      window.localStorage.removeItem("pca:commented:v1");
      window.localStorage.removeItem("pca:emailPrefs:v1");
      await reset();
      router.replace("/");
    } finally {
      setDeleting(false);
    }
  };

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

        <div className="mt-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <h1 className="headline text-4xl">Privacy &amp; data</h1>
        </div>
        <p className="mt-3 text-base text-ink-600">
          Everything we know about you. See it, export it, or delete it.{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Read the full policy.
          </Link>
        </p>

        <section className="mt-10 rounded-xl border border-rule bg-paper p-5">
          <h2 className="font-display text-xl text-ink">What we know</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Age range" value={profile.ageRange} />
            <Field label="Occupation" value={profile.occupation} />
            <Field label="State" value={profile.state} />
            <Field label="Income" value={profile.income} />
            <Field label="Household" value={profile.household} />
            <Field
              label="Topics"
              value={profile.topics.join(", ") || "none"}
            />
            <Field
              label="Member since"
              value={new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
          </dl>
          <p className="mt-5 text-xs text-muted">
            To edit any field, go to{" "}
            <Link
              href="/settings/profile"
              className="text-accent hover:underline"
            >
              Profile settings
            </Link>
            .
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-rule bg-paper p-5">
          <h2 className="font-display text-xl text-ink">Export</h2>
          <p className="mt-2 text-sm text-ink-600">
            Download everything we&rsquo;ve stored as a JSON file. Includes
            profile, saved rules, commented rules, and email preferences.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm text-ink hover:border-ink/40 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Download my data"}
          </button>
        </section>

        <section className="mt-6 rounded-xl border border-accent/30 bg-accent-50 p-5">
          <h2 className="font-display flex items-center gap-2 text-xl text-ink">
            <AlertTriangle className="h-5 w-5 text-accent" />
            Delete account
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Removes your profile, saved rules, commented rules, email
            preferences, and your account from our auth provider. This action
            is immediate and can&rsquo;t be undone.
          </p>
          {!confirmingDelete ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent bg-paper px-4 py-2 text-sm text-accent hover:bg-accent hover:text-cream-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete my account
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-ink">
                Are you sure? This permanently deletes everything.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-cream-50 hover:bg-accent-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "Deleting…" : "Yes, delete everything"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-4 py-2 text-sm text-ink hover:border-ink/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || "none"}</dd>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
