"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
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

      <section className="mx-auto max-w-md px-6 pb-24 pt-16">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">
          Sign in
        </p>
        <h1 className="headline mt-2 text-3xl md:text-4xl">
          Welcome back.
        </h1>
        <p className="mt-3 text-sm text-ink-600">
          We&rsquo;ll email you a magic link. No password.
        </p>

        <div className="mt-10">
          {isClerkConfigured ? <ClerkSignIn /> : <NotConfiguredMessage />}
        </div>
      </section>
    </main>
  );
}

function ClerkSignIn() {
  return (
    <SignIn
      // Returning users go to the feed. /feed will redirect to /onboarding
      // if their DB profile doesn't exist yet.
      fallbackRedirectUrl="/feed"
      signUpFallbackRedirectUrl="/onboarding"
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "bg-paper border border-rule shadow-card rounded-2xl",
          headerTitle: "font-display text-2xl text-ink",
          formButtonPrimary:
            "bg-ink hover:bg-ink-600 text-cream-50 rounded-full",
          footerActionLink: "text-accent hover:underline",
        },
      }}
    />
  );
}

function NotConfiguredMessage() {
  return (
    <div className="rounded-2xl border border-rule bg-paper p-8 text-sm text-ink-600">
      <p className="font-display text-lg text-ink">
        Auth isn&rsquo;t configured yet.
      </p>
      <p className="mt-3">
        Accounts are not connected in this environment. You can still try
        onboarding with a profile stored on this device. To enable sign-in,
        set the Clerk env vars listed in{" "}
        <code className="font-mono text-xs">.env.local.example</code> and
        restart the dev server.
      </p>
      <Link
        href="/onboarding"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-cream-50 hover:bg-ink-600"
      >
        Continue without an account
      </Link>
    </div>
  );
}
