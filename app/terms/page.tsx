import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Terms · OpenComment",
  description: "Terms of service for OpenComment.",
};

const LAST_UPDATED = "April 29, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Logo />
          <Link href="/" className="text-sm text-ink-600 hover:text-ink">
            Home
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-12">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          Terms
        </p>
        <h1 className="headline mt-2 text-4xl md:text-5xl">
          Terms of Service.
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated {LAST_UPDATED}</p>

        <aside className="mt-6 rounded-xl border border-rule bg-cream-50 p-4 text-sm text-ink-600">
          <strong className="text-ink">Draft.</strong> These terms are the
          current working draft. Counsel review is pending before any public
          marketing push.
        </aside>

        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">1. Who we are</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            OpenComment is a civic tool that helps people in the United States
            find federal proposed rules affecting their lives and submit
            substantive public comments to the federal docket at
            regulations.gov. By using the service you agree to these terms.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">2. Eligibility</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            You must be at least 13 years old to use OpenComment, and 18 or
            older to receive email and submit comments referencing your
            household. The service is built for U.S. residents commenting on
            U.S. federal rulemaking.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">3. Your account</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            You sign in with a magic link sent to your email. Keep your email
            secure. You&rsquo;re responsible for activity on your account. If
            you suspect unauthorized access, contact us at
            security@opencomment.org.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">4. Acceptable use</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            OpenComment exists to give individual citizens a voice. You agree
            not to:
          </p>
          <ul className="mt-4 space-y-3 text-base leading-relaxed text-ink-600">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                Use the service to generate comments under identities that
                aren&rsquo;t yours, or to coordinate astroturf comment volume.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                Submit comments containing knowingly false statements about
                yourself, the rule, or the agency.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                Operate multiple accounts to amplify your own comments.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                Scrape, redistribute, or commercially exploit OpenComment&rsquo;s
                output without permission.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              <span>
                Reverse-engineer or attempt to bypass our rate limits, abuse
                detection, or AI safety guardrails.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-base leading-relaxed text-ink-600">
            We may suspend accounts that violate these limits. We aim to be
            transparent when we do so.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">5. Comments are yours</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            We help draft. You decide what gets sent. When you submit a comment
            on regulations.gov, you do so under your own name and that comment
            becomes part of the federal public record. We don&rsquo;t claim
            authorship, ownership, or licensing rights over your submitted
            comments.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">6. Our role with the federal docket</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            OpenComment is independent of regulations.gov, the General Services
            Administration, and any federal agency. We surface federal data via
            the public regulations.gov API; we are not a federal service.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">7. No warranty on outputs</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Our AI-drafted summaries and comments are starting points. They
            may contain errors. You are responsible for reviewing what you
            submit. We make no representation that any draft accurately
            represents the rule, your situation, or any factual matter.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">8. Limitation of liability</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            To the fullest extent permitted by law, OpenComment is provided as
            is. We are not liable for indirect, incidental, or consequential
            damages arising from your use of the service.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">9. Termination</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            You can delete your account at any time from your privacy settings.
            We can suspend or terminate accounts that violate these terms. On
            termination, your data is removed per our{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">10. Changes to these terms</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            We&rsquo;ll update this page and notify you by email if we change
            these terms in a way that materially affects your rights.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl text-ink">11. Contact</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Questions about these terms? Reach us at{" "}
            <span className="text-ink">hello@opencomment.org</span>.
          </p>
        </section>

        <div className="mt-16 border-t border-rule pt-8 text-sm text-muted">
          See also: <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
        </div>
      </article>
    </main>
  );
}
