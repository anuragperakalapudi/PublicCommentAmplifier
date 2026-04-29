import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Privacy · OpenComment",
  description:
    "What OpenComment collects, how we use it, and what we never do with your data.",
};

const LAST_UPDATED = "April 25, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Logo />
          <Link
            href="/"
            className="text-sm text-ink-600 hover:text-ink"
          >
            Home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          Privacy
        </p>
        <h1 className="headline mt-2 text-4xl md:text-5xl">
          What we do, and what we don&rsquo;t, with your data.
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated {LAST_UPDATED}</p>

        <aside className="mt-6 rounded-xl border border-rule bg-cream-50 p-4 text-sm text-ink-600">
          <strong className="text-ink">Draft.</strong> This policy is the current
          working draft. Counsel review is pending before any public marketing
          push. The substantive commitments below are how the product is built;
          the words around them may tighten before launch.
        </aside>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">In one paragraph</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            OpenComment exists to help ordinary people participate in federal
            rulemaking. To do that we ask you for context about your life:
            your occupation, state, household. We use that context to rank what
            you see and to draft comments anchored to your real situation.
            We don&rsquo;t sell that data, we don&rsquo;t share it, and we
            don&rsquo;t train models on it. You can delete every byte of it
            with one click.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">What we don&rsquo;t do</h2>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ink-600">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">We never auto-submit.</strong>{" "}
                Every comment is submitted manually by you, on regulations.gov,
                under your name. We don&rsquo;t POST anything to the federal
                docket on your behalf.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">We don&rsquo;t sell your data.</strong>{" "}
                Not to advertisers. Not to data brokers. Not to political
                operations. Not to anyone.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">We don&rsquo;t train models on you.</strong>{" "}
                Your profile, your stories, and the comments we draft for you
                are not used to train any model, ours or anyone else&rsquo;s.
                Our LLM provider has the same commitment in their data policy.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">We don&rsquo;t generate identical text across users.</strong>{" "}
                Astroturf comments are exactly the problem we&rsquo;re trying
                to fix. Every draft is anchored to your specific profile, the
                specific rule, and the variant you choose.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">We don&rsquo;t track you across the web.</strong>{" "}
                No third-party advertising trackers. No cross-site profiles.
                Analytics is privacy-first and aggregated.
              </span>
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">What we do collect</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            The data you give us during onboarding: age range, occupation,
            state of residence, income bracket, household status, topics of
            interest. Optionally: a short free-text description of your
            situation, and short personal stories you choose to share. We also
            keep an account-level record of the rules you save and the rules
            you mark as commented on.
          </p>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            We do not collect: your real name (unless you put it in a story),
            your address, your phone number, your race, your political
            affiliation, your immigration status (you may choose to mention
            this in a story; we never require it), or any biometric or
            behavioral data.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">How we use it</h2>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ink-600">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">Ranking your feed.</strong> We use
                your topics, occupation, and state to score open federal rules
                against your situation.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">Drafting your comments.</strong>{" "}
                When you open a rule, we send the rule&rsquo;s text and your
                profile to Google&rsquo;s Gemini API to draft a comment in your
                voice. Google&rsquo;s commercial terms prohibit them from
                training on or retaining that content.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                <strong className="text-ink">Sending email you&rsquo;ve asked for.</strong>{" "}
                Weekly digests, closing-soon reminders, and final-rule notices,
                only at the cadence you&rsquo;ve set in your email preferences.
                You can opt out of any one of those, or all of them.
              </span>
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Where it lives</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Your data is stored in a Postgres database hosted by Supabase in
            the United States. It is encrypted at rest and in transit. API
            keys for any third-party service we use (LLM provider, email
            sender, federal docket) are stored server-side only and never
            exposed to your browser.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Your controls</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            From your settings, you can:
          </p>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ink-600">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>See every field we have stored about you, in plain English.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>Delete any individual field, or your entire account.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>Export everything we have as a JSON file.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                Turn off any email channel, or all of them, at any time. Every
                email we send also has a one-click unsubscribe link.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-base leading-relaxed text-ink-600">
            Account deletion is a single click plus one confirmation. It runs
            within 24 hours and removes your profile, saved rules, commented
            history, stories, and email preferences from our database, plus
            your account from our auth provider.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Cookies and tracking</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            We use only the cookies needed to keep you signed in. We don&rsquo;t
            use third-party advertising cookies. If we ever add anything beyond
            essential cookies, we&rsquo;ll add a banner asking first.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Children</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            OpenComment is for adults. We don&rsquo;t knowingly collect data
            from anyone under 13. If you believe we&rsquo;ve received data from
            a minor, contact us and we&rsquo;ll delete it.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Changes to this policy</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            If we materially change how we collect or use data, we&rsquo;ll
            update this page and email everyone with an active account before
            the change takes effect.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Contact</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Questions, concerns, or a data request you can&rsquo;t do
            self-serve? Reach us at{" "}
            <span className="text-ink">privacy@opencomment.org</span>.
          </p>
        </section>

        <div className="mt-16 border-t border-rule pt-8 text-sm text-muted">
          See also: <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
        </div>
      </article>
    </main>
  );
}
