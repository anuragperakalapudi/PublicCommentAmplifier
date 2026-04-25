import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { addSaved, listSaved, removeSaved } from "@/lib/db/saved";

function notConfigured() {
  return NextResponse.json(
    { error: "not_configured" },
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
  const saved = await listSaved(userId);
  return NextResponse.json({ saved });
}

export async function POST(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { documentId } = (await req.json()) as { documentId?: string };
  if (!documentId) {
    return NextResponse.json({ error: "missing documentId" }, { status: 400 });
  }
  await addSaved(userId, documentId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { documentId } = (await req.json()) as { documentId?: string };
  if (!documentId) {
    return NextResponse.json({ error: "missing documentId" }, { status: 400 });
  }
  await removeSaved(userId, documentId);
  return NextResponse.json({ ok: true });
}
