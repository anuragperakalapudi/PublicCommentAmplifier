import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import {
  getEmailPreferences,
  upsertEmailPreferences,
  type EmailPreferences,
} from "@/lib/db/emailPreferences";

function notConfigured() {
  return NextResponse.json({ error: "not_configured" }, { status: 501 });
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const prefs = await getEmailPreferences(userId);
  return NextResponse.json({ prefs });
}

export async function PATCH(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = (await req.json()) as { prefs?: EmailPreferences };
  if (!body?.prefs) {
    return NextResponse.json({ error: "missing prefs" }, { status: 400 });
  }
  const saved = await upsertEmailPreferences(userId, body.prefs);
  return NextResponse.json({ prefs: saved });
}
