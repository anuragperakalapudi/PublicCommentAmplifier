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

// Server-side lookup of a user's primary email address by Clerk user id.
// Used by cron jobs to fan out emails. Returns null when Clerk isn't
// configured or the user doesn't exist / has no primary email.
export async function getUserEmail(userId: string): Promise<string | null> {
  if (!isClerkConfigured) return null;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary = user.emailAddresses.find((e) => e.id === primaryId);
    return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}

// Returns first/last name from Clerk for use in greetings when displayName
// isn't set on the local profile. Null when unavailable.
export async function getUserName(userId: string): Promise<string | null> {
  if (!isClerkConfigured) return null;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.firstName ?? null;
  } catch {
    return null;
  }
}
