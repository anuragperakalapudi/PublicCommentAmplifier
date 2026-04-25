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
  type AgeRange, type IncomeBracket, type HouseholdStatus, type Topic,
  type UserProfile,
} from "@/lib/types";
import { FeedHeader } from "@/components/feed/FeedHeader";

export default function SettingsProfilePage() {
  const router = useRouter();
  const { profile, hydrated, setProfile } = useProfile();

  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [occupation, setOccupation] = useState("");
  const [state, setState] = useState<string>("");
  const [income, setIncome] = useState<IncomeBracket | null>(null);
  const [household, setHousehold] = useState<HouseholdStatus | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/onboarding");
    if (profile) {
      setAgeRange(profile.ageRange);
      setOccupation(profile.occupation);
      setState(profile.state);
      setIncome(profile.income);
      setHousehold(profile.household);
      setTopics(profile.topics);
    }
  }, [profile, hydrated, router]);

  const canSave =
    ageRange && occupation.trim().length >= 2 && state && income && household && topics.length >= 1;

  const toggleTopic = (t: Topic) =>
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const handleSave = async () => {
    if (!canSave || !ageRange || !state || !income || !household) return;
    const next: UserProfile = {
      ageRange,
      occupation: occupation.trim(),
      state,
      income,
      household,
      topics,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    };
    await setProfile(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
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

        <div className="mt-10 space-y-7">
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
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream-50 shadow-card transition hover:bg-accent-700 disabled:bg-accent/40 disabled:shadow-none"
          >
            <Check className="h-4 w-4" />
            {savedFlash ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </section>
    </main>
  );
}
