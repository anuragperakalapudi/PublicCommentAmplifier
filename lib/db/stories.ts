import { MAX_STORIES, type Story, type Topic } from "../types";
import { supabaseAdmin } from "./client";

interface DbStoryRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface StoryInput {
  title: string;
  body: string;
  tags: Topic[];
}

function rowToStory(row: DbStoryRow): Story {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    tags: (row.tags ?? []) as Topic[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listStories(userId: string): Promise<Story[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb
    .from("stories")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToStory(row as DbStoryRow));
}

export async function getStory(
  userId: string,
  id: string,
): Promise<Story | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("stories")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToStory(data as DbStoryRow) : null;
}

export async function addStory(
  userId: string,
  input: StoryInput,
): Promise<Story> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");

  const { count, error: countError } = await sb
    .from("stories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= MAX_STORIES) {
    throw new Error("Story limit reached");
  }

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("stories")
    .insert({
      user_id: userId,
      title: input.title,
      body: input.body,
      tags: input.tags,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToStory(data as DbStoryRow);
}

export async function updateStory(
  userId: string,
  id: string,
  input: Partial<StoryInput>,
): Promise<Story | null> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.tags !== undefined) patch.tags = input.tags;

  const { data, error } = await sb
    .from("stories")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToStory(data as DbStoryRow) : null;
}

export async function deleteStory(
  userId: string,
  id: string,
): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("stories")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAllStories(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("stories").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}
