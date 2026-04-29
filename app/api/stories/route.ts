import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/config";
import { deleteWhyInFeedForUserSafe } from "@/lib/db/cache";
import { addStory, listStories } from "@/lib/db/stories";
import { refreshProfileEmbeddingSafe } from "@/lib/semantic";
import { ALL_TOPICS, type Topic } from "@/lib/types";

const VALID_TOPICS = new Set<string>(ALL_TOPICS);

function notConfigured() {
  return NextResponse.json({ error: "not_configured" }, { status: 501 });
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function parseTags(tags: unknown): Topic[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(
    (tag): tag is Topic =>
      typeof tag === "string" && VALID_TOPICS.has(tag),
  );
}

export async function GET() {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const stories = await listStories(userId);
  return NextResponse.json({ stories });
}

export async function POST(req: Request) {
  if (!isClerkConfigured || !isSupabaseConfigured) return notConfigured();
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const body = (await req.json()) as {
    title?: unknown;
    body?: unknown;
    tags?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const storyBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!title || !storyBody) {
    return NextResponse.json(
      { error: "title_and_body_required" },
      { status: 400 },
    );
  }

  try {
    const story = await addStory(userId, {
      title,
      body: storyBody,
      tags: parseTags(body.tags),
    });
    await deleteWhyInFeedForUserSafe(userId);
    await refreshProfileEmbeddingSafe(userId);
    return NextResponse.json({ story }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error && err.message === "Story limit reached"
            ? "story_limit_reached"
            : "save_failed",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 400 },
    );
  }
}
