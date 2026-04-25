import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { deleteProfile, getProfile, upsertProfile } from "@/lib/db/profiles";
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
  const saved = await upsertProfile(userId, body.profile);
  return NextResponse.json({ profile: saved });
}

export async function DELETE() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  await deleteProfile(userId);
  return NextResponse.json({ ok: true });
}
