import { isClerkConfigured } from "./config";

// Returns the Clerk user ID for the current request, or null if Clerk is not
// configured (or the request is unauthenticated).
//
// We dynamic-import @clerk/nextjs/server so the package is only loaded when
// keys exist — otherwise Clerk's runtime checks would throw at import time.
export async function currentUserId(): Promise<string | null> {
  if (!isClerkConfigured) return null;
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId ?? null;
}
