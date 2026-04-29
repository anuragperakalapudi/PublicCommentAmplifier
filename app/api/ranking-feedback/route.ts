import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import {
  deleteAllFeedback,
  listFeedback,
  setFeedback,
} from "@/lib/db/rankingFeedback";
import type { RankingSignal } from "@/lib/types";

function notConfigured() {
  return NextResponse.json({ error: "not_configured" }, { status: 501 });
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function isSignal(value: unknown): value is RankingSignal {
  return value === "more_like" || value === "less_like";
}

export async function GET() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const rows = await listFeedback(userId);
  const feedback = Object.fromEntries(
    rows.map((row) => [row.documentId, row.signal]),
  ) as Record<string, RankingSignal>;
  return NextResponse.json({ feedback });
}

export async function POST(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { documentId, signal } = (await req.json()) as {
    documentId?: unknown;
    signal?: unknown;
  };
  if (typeof documentId !== "string" || !documentId.trim()) {
    return NextResponse.json({ error: "missing documentId" }, { status: 400 });
  }
  if (signal !== null && signal !== undefined && !isSignal(signal)) {
    return NextResponse.json({ error: "invalid signal" }, { status: 400 });
  }
  await setFeedback(userId, documentId, signal ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  await deleteAllFeedback(userId);
  return NextResponse.json({ ok: true });
}
