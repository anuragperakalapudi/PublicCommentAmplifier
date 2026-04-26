import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { deleteProfile, getProfile } from "@/lib/db/profiles";
import { deleteAllSaved, listSaved } from "@/lib/db/saved";
import { deleteAllCommented, listCommented } from "@/lib/db/commented";
import { deleteAllEmailLog } from "@/lib/db/emailLog";
import { deleteAllWatched } from "@/lib/db/docketWatch";

function notConfigured() {
  return NextResponse.json({ error: "not_configured" }, { status: 501 });
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// Returns a JSON dump of everything we have stored about the user.
export async function GET() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const [profile, saved, commented] = await Promise.all([
    getProfile(userId),
    listSaved(userId),
    listCommented(userId),
  ]);
  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      userId,
      profile,
      saved,
      commented,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="opencomment-export-${userId}.json"`,
      },
    },
  );
}

// Deletes all DB rows associated with the current user, then deletes the
// user from Clerk. The frontend should redirect to "/" after success.
export async function DELETE() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  await Promise.all([
    deleteProfile(userId),
    deleteAllSaved(userId),
    deleteAllCommented(userId),
    deleteAllEmailLog(userId),
    deleteAllWatched(userId),
  ]);
  // Delete the Clerk user too. Dynamic import so the package isn't pulled
  // when Clerk isn't configured at module load.
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        warning: "DB cleared, but Clerk delete failed.",
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 207 },
    );
  }
  return NextResponse.json({ ok: true });
}
