"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { Field, TextInput, ChoiceGrid } from "@/components/onboarding/Field";
import { TopicChips } from "@/components/onboarding/TopicChips";
import { useProfile } from "@/context/ProfileContext";
import {
  AGE_RANGES, INCOME_BRACKETS, HOUSEHOLD_STATUSES, US_STATES,
  type AgeRange, type IncomeBracket, type HouseholdStatus, type Topic,
  type UserProfile,
} from "@/lib/types";

const STEPS = ["Identity", "Household", "Issues you care about"];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, profile } = useProfile();

  const [step, setStep] = useState(1);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [occupation, setOccupation] = useState("");
  const [state, setState] = useState<string>("");
  const [income, setIncome] = useState<IncomeBracket | null>(null);
  const [household, setHousehold] = useState<HouseholdStatus | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  // pre-fill from existing profile (allows editing later)
  useEffect(() => {
    if (profile) {
      setAgeRange(profile.ageRange);
      setOccupation(profile.occupation);
      setState(profile.state);
      setIncome(profile.income);
      setHousehold(profile.household);
      setTopics(profile.topics);
    }
  }, [profile]);

  const canAdvance =
    (step === 1 && ageRange && occupation.trim().length >= 2 && state) ||
    (step === 2 && income && household) ||
    (step === 3 && topics.length >= 1);

  const toggleTopic = (t: Topic) =>
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const finish = () => {
    if (!ageRange || !state || !income || !household) return;
    const next: UserProfile = {
      ageRange,
      occupation: occupation.trim(),
      state,
      income,
      household,
      topics,
      createdAt: new Date().toISOString(),
    };
    setProfile(next);
    router.push("/feed");
  };

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Logo />
        <span className="text-xs text-muted">Step {step} of 3</span>
      </header>

      <section className="mx-auto max-w-2xl px-6 pb-24">
        <div className="mt-6">
          <ProgressBar step={step} total={3} labels={STEPS} />
        </div>

        <aside className="mt-6 flex items-start gap-3 rounded-xl border border-rule bg-cream-50 p-4 text-sm text-ink-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
          <p>
            <strong className="text-ink">Used only to rank your feed and draft your comments.</strong>{" "}
            We don&rsquo;t sell your data, share it, or train models on it. We
            never auto-submit. You can delete everything with one click.{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Read our privacy policy.
            </Link>
          </p>
        </aside>

        <div className="mt-12 min-h-[440px]">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <h1 className="headline text-4xl md:text-5xl">
                  First, the basics.
                </h1>
                <p className="mt-3 text-base text-ink-600">
                  Federal reviewers weigh comments more carefully when they
                  reflect a real person and a specific place. None of this
                  leaves your device.
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

                  <Field
                    label="Occupation"
                    hint="A short description in your own words — e.g., 'home health aide,' 'small farm operator,' 'middle-school teacher.'"
                  >
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
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <h1 className="headline text-4xl md:text-5xl">
                  Your household, in two clicks.
                </h1>
                <p className="mt-3 text-base text-ink-600">
                  This shapes which provisions we surface — Medicaid HCBS reads
                  very differently to a single parent than to a retiree.
                </p>

                <div className="mt-10 space-y-7">
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
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <h1 className="headline text-4xl md:text-5xl">
                  What rules should we surface?
                </h1>
                <p className="mt-3 text-base text-ink-600">
                  Pick at least one. You can change these any time. We use them
                  to query the federal docket and rank what you see.
                </p>

                <div className="mt-10">
                  <TopicChips selected={topics} onToggle={toggleTopic} />
                </div>

                {topics.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-sm text-muted"
                  >
                    {topics.length} {topics.length === 1 ? "issue" : "issues"} selected.
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-rule pt-6">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-2 text-sm text-ink-600 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream-50 shadow-card transition hover:bg-ink-600 disabled:bg-ink/40 disabled:shadow-none"
            >
              Continue
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance}
              onClick={finish}
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream-50 shadow-card transition hover:bg-accent-700 disabled:bg-accent/40 disabled:shadow-none"
            >
              <Check className="h-4 w-4" />
              Build my feed
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
