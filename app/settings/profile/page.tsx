"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { Field, TextInput, ChoiceGrid } from "@/components/onboarding/Field";
import { TopicChips } from "@/components/onboarding/TopicChips";
import {
  AGE_RANGES, INCOME_BRACKETS, HOUSEHOLD_STATUSES, US_STATES,
  FREE_TEXT_CONTEXT_LIMIT,
  type AgeRange, type IncomeBracket, type HouseholdStatus, type Topic,
  type UserProfile,
} from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";

export default function SettingsProfilePage() {
  const router = useRouter();
  const { profile, hydrated, setProfile } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [occupation, setOccupation] = useState("");
  const [state, setState] = useState<string>("");
  const [income, setIncome] = useState<IncomeBracket | null>(null);
  const [household, setHousehold] = useState<HouseholdStatus | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [freeTextContext, setFreeTextContext] = useState("");
  const [additionalStates, setAdditionalStates] = useState<string[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setAgeRange(profile.ageRange);
      setOccupation(profile.occupation);
      setState(profile.state);
      setIncome(profile.income);
      setHousehold(profile.household);
      setTopics(profile.topics);
      setFreeTextContext(profile.freeTextContext ?? "");
      setAdditionalStates(profile.additionalStates ?? []);
    }
  }, [profile, hydrated, router]);

  const canSave =
    ageRange && occupation.trim().length >= 2 && state && income && household && topics.length >= 1;

  const toggleTopic = (t: Topic) =>
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const toggleState = (s: string) =>
    setAdditionalStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleSave = async () => {
    if (!canSave || !ageRange || !state || !income || !household || saving) return;
    const trimmedName = displayName.trim();
    const trimmedContext = freeTextContext.trim();
    const next: UserProfile = {
      displayName: trimmedName || undefined,
      ageRange,
      occupation: occupation.trim(),
      state,
      income,
      household,
      topics,
      freeTextContext: trimmedContext || undefined,
      additionalStates: additionalStates.filter((s) => s !== state),
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    };
    setSaving(true);
    setSaveError(null);
    try {
      await setProfile(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (err) {
      setSavedFlash(false);
      setSaveError(
        err instanceof Error
          ? err.message
          : "We could not save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
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

        <h1 className="headline mt-6 text-4xl">Profile</h1>
        <p className="mt-3 text-base text-ink-600">
          Used only to rank your feed and draft your comments. Update any time.
        </p>

        {saveError && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent-50 p-3 text-sm text-accent">
            {saveError}
          </p>
        )}

        <div className="mt-10 space-y-7">
          <Field
            label="What should we call you?"
            hint="First name only is fine. Optional. Used for your avatar."
          >
            <TextInput
              value={displayName}
              onChange={setDisplayName}
              placeholder="Alex"
            />
          </Field>

          <Field label="Age range">
            <ChoiceGrid
              options={AGE_RANGES}
              value={ageRange}
              onChange={setAgeRange}
              columns={3}
            />
          </Field>

          <Field label="Occupation">
            <TextInput
              value={occupation}
              onChange={setOccupation}
              placeholder="home health aide"
            />
          </Field>

          <Field label="State">
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-rule bg-paper px-4 py-3 font-display text-lg text-ink focus:border-accent focus:outline-none"
            >
              <option value="">Select your state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Household income">
            <ChoiceGrid
              options={INCOME_BRACKETS}
              value={income}
              onChange={setIncome}
              columns={3}
            />
          </Field>

          <Field label="Household status">
            <ChoiceGrid
              options={HOUSEHOLD_STATUSES}
              value={household}
              onChange={setHousehold}
              columns={3}
            />
          </Field>

          <Field label="Topics">
            <TopicChips selected={topics} onToggle={toggleTopic} />
          </Field>

          <div className="border-t border-rule pt-7">
            <h2 className="font-display text-2xl text-ink">
              More context
            </h2>
            <p className="mt-2 text-sm text-ink-600">
              Optional details used only for ranking and drafting. Leave blank
              if nothing else should shape your feed.
            </p>
          </div>

          <Field
            label="Other context"
            hint="Caregiving, health, job, family, or other lived context that should shape matching."
          >
            <textarea
              value={freeTextContext}
              onChange={(e) =>
                setFreeTextContext(
                  e.target.value.slice(0, FREE_TEXT_CONTEXT_LIMIT),
                )
              }
              maxLength={FREE_TEXT_CONTEXT_LIMIT}
              rows={5}
              placeholder="I care for my mother, who relies on home health services..."
              className="w-full rounded-md border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <p className="mt-2 text-right font-mono text-xs text-muted">
              {freeTextContext.length}/{FREE_TEXT_CONTEXT_LIMIT}
            </p>
          </Field>

          <Field
            label="Other states you care about"
            hint="Family in, work in, or regularly affected by rules in another state."
          >
            <div className="flex flex-wrap gap-2">
              {US_STATES.map((s) => {
                const active = additionalStates.includes(s);
                const primary = s === state;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={primary}
                    onClick={() => toggleState(s)}
                    className={`inline-flex min-w-11 justify-center rounded-full border px-3 py-2 font-mono text-xs transition ${
                      active
                        ? "border-ink bg-ink text-cream-50 shadow-card"
                        : "border-rule bg-paper text-ink hover:border-ink/40"
                    } ${primary ? "cursor-not-allowed opacity-35" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-rule pt-6">
          <span className="text-xs text-muted">
            Member since{" "}
            {new Date(profile.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream-50 shadow-card transition hover:bg-accent-700 disabled:bg-accent/40 disabled:shadow-none"
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving..." : savedFlash ? "Saved" : "Save changes"}
          </button>
        </div>
      </section>
    </main>
  );
}
