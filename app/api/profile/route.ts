import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { deleteWhyInFeedForUserSafe } from "@/lib/db/cache";
import { deleteProfile, getProfile, upsertProfile } from "@/lib/db/profiles";
import { refreshProfileEmbeddingSafe } from "@/lib/semantic";
import type { UserProfile } from "@/lib/types";

function notConfigured() {
  return NextResponse.json(
    { error: "not_configured", message: "Auth/DB not provisioned." },
    { status: 501 },
  );
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const profile = await getProfile(userId);
  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = (await req.json()) as { profile: UserProfile };
  if (!body?.profile) {
    return NextResponse.json({ error: "missing profile" }, { status: 400 });
  }
  let saved: UserProfile;
  try {
    saved = await upsertProfile(userId, body.profile);
  } catch (err) {
    return NextResponse.json(
      {
        error: "profile_save_failed",
        message: err instanceof Error ? err.message : "Could not save profile.",
      },
      { status: 500 },
    );
  }
  await deleteWhyInFeedForUserSafe(userId);
  void refreshProfileEmbeddingSafe(userId);
  return NextResponse.json({ profile: saved });
}

export async function DELETE() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  await deleteWhyInFeedForUserSafe(userId);
  await deleteProfile(userId);
  return NextResponse.json({ ok: true });
}
