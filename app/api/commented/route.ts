import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import {
  listCommented,
  markCommented,
  unmarkCommented,
} from "@/lib/db/commented";

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
  const rows = await listCommented(userId);
  // Match the client-side CommentedEntry shape.
  const commented = rows.map((r) => ({
    documentId: r.documentId,
    markedAt: r.markedAt,
    commentText: r.commentText,
  }));
  return NextResponse.json({ commented });
}

export async function POST(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { documentId, commentText } = (await req.json()) as {
    documentId?: string;
    commentText?: string | null;
  };
  if (!documentId) {
    return NextResponse.json({ error: "missing documentId" }, { status: 400 });
  }
  await markCommented(userId, documentId, commentText ?? null);
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
  await unmarkCommented(userId, documentId);
  return NextResponse.json({ ok: true });
}
