import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { deleteWhyInFeedForUserSafe } from "@/lib/db/cache";
import { deleteStory, getStory, updateStory } from "@/lib/db/stories";
import { refreshProfileEmbeddingSafe } from "@/lib/semantic";
import { ALL_TOPICS, type Topic } from "@/lib/types";

const VALID_TOPICS = new Set<string>(ALL_TOPICS);

function notConfigured() {
  return NextResponse.json({ error: "not_configured" }, { status: 501 });
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function parseTags(tags: unknown): Topic[] | undefined {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) return [];
  return tags.filter(
    (tag): tag is Topic =>
      typeof tag === "string" && VALID_TOPICS.has(tag),
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const story = await getStory(userId, params.id);
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ story });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = (await req.json()) as {
    title?: unknown;
    body?: unknown;
    tags?: unknown;
  };

  const patch = {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    body: typeof body.body === "string" ? body.body.trim() : undefined,
    tags: parseTags(body.tags),
  };

  if (patch.title === "" || patch.body === "") {
    return NextResponse.json(
      { error: "title_and_body_required" },
      { status: 400 },
    );
  }

  const story = await updateStory(userId, params.id, patch);
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await deleteWhyInFeedForUserSafe(userId);
  await refreshProfileEmbeddingSafe(userId);
  return NextResponse.json({ story });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  await deleteStory(userId, params.id);
  await deleteWhyInFeedForUserSafe(userId);
  await refreshProfileEmbeddingSafe(userId);
  return NextResponse.json({ ok: true });
}
