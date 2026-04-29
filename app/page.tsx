"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Megaphone, ShieldCheck } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { Logo } from "@/components/shared/Logo";

export default function LandingPage() {
  const { profile, hydrated } = useProfile();
  const signedIn = hydrated && !!profile;
  const ctaHref = signedIn ? "/feed" : "/onboarding";
  const ctaLabel = signedIn ? "Continue to your feed" : "Build your civic profile";
  const navCtaLabel = signedIn ? "Open feed" : "Get started";

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
          <a className="hover:text-ink" href="#how">How it works</a>
          <a className="hover:text-ink" href="#why">Why it matters</a>
          {!signedIn && (
            <Link href="/sign-in" className="hover:text-ink">
              Sign in
            </Link>
          )}
          <Link
            href={ctaHref}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream-50 hover:bg-ink-600"
          >
            {navCtaLabel}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-24">
        <div className="grid items-end gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              className="chip mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Civic infrastructure, in beta
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
              className="headline text-[clamp(2.5rem,6vw,4.75rem)]"
            >
              The federal government writes{" "}
              <em className="font-display italic text-accent">
                thousands of rules
              </em>{" "}
              a year.
              <br />
              Lobbyists comment on every one.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600"
            >
              You should too. OpenComment surfaces the proposed
              rules that affect your life, and helps you put a substantive
              comment into the official record, in your own voice, in under a
              minute.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-base font-medium text-cream-50 shadow-card transition hover:bg-ink-600"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              {!signedIn && (
                <span className="text-sm text-muted">
                  No account. No email. Stored on your device.
                </span>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="md:col-span-5"
          >
            <div className="paper-grain rounded-2xl border border-rule p-7 shadow-card">
              <div className="flex items-center justify-between">
                <span className="chip">
                  <FileText className="h-3 w-3" /> Proposed Rule · CMS
                </span>
                <span className="text-xs text-muted">Closes in 18 days</span>
              </div>
              <h3 className="font-display mt-4 text-2xl leading-tight text-ink">
                Permanent coverage of audio-only telehealth for Medicare
                beneficiaries.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                Would let licensed home health aides facilitate reimbursable
                phone visits for rural and homebound patients.
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
                <div className="flex items-center gap-2 text-sm text-forest">
                  <span className="h-2 w-2 rounded-full bg-forest" />
                  96% match for your profile
                </div>
                <span className="text-sm font-medium text-accent">
                  Read & comment →
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="dotted-divider mt-24" />

        <section id="how" className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Tell us, in plain English, who you are.",
              body:
                "Two minutes. State, occupation, household. The kind of context an agency reviewer would actually weigh.",
            },
            {
              icon: FileText,
              title: "We pull the rules that touch your life.",
              body:
                "Real, open comment periods from the federal docket, ranked by how directly they affect you, not by SEO.",
            },
            {
              icon: Megaphone,
              title: "Your comment, in your voice, on the record.",
              body:
                "We draft a substantive comment anchored to your situation. You read it, edit if you want, then paste it on regulations.gov.",
            },
          ].map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border-l-2 border-rule pl-5"
            >
              <Icon className="h-5 w-5 text-accent" />
              <h4 className="font-display mt-3 text-xl leading-snug">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
            </motion.div>
          ))}
        </section>

        <section
          id="why"
          className="mt-24 rounded-2xl border border-rule bg-paper p-10"
        >
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="font-display text-3xl italic leading-snug text-ink">
                &ldquo;The notice-and-comment process only works if the people
                who live under the rules are heard alongside the lobbyists who
                draft them.&rdquo;
              </p>
              <p className="mt-4 text-sm uppercase tracking-widest text-muted">
                Our thesis, in one sentence.
              </p>
            </div>
            <div className="md:col-span-5">
              <dl className="grid gap-6">
                <div>
                  <dt className="text-sm text-muted">Federal rules per year</dt>
                  <dd className="font-display text-3xl">~3,500</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">
                    Share of comments from organized interests
                  </dt>
                  <dd className="font-display text-3xl">~92%</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">
                    Comment periods open right now
                  </dt>
                  <dd className="font-display text-3xl text-accent">1,200+</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-muted md:flex-row md:items-center">
          <Logo small />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>Built for the public, not for the docket-watchers.</span>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
