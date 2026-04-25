"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Wraps children with ClerkProvider when configured. When not configured we
// pass through so the dev server still runs without keys.
export function AuthShell({ children }: { children: ReactNode }) {
  if (!isClerkConfigured) return <>{children}</>;
  return <ClerkProvider>{children}</ClerkProvider>;
}
