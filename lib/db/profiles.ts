import type { UserProfile } from "../types";
import { supabaseAdmin } from "./client";

interface DbProfileRow {
  user_id: string;
  display_name: string | null;
  age_range: string | null;
  occupation: string | null;
  state: string | null;
  income_bracket: string | null;
  household: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: DbProfileRow): UserProfile {
  return {
    displayName: row.display_name ?? undefined,
    ageRange: (row.age_range ?? "25–34") as UserProfile["ageRange"],
    occupation: row.occupation ?? "",
    state: row.state ?? "",
    income: (row.income_bracket ?? "Prefer not to say") as UserProfile["income"],
    household: (row.household ?? "Other") as UserProfile["household"],
    topics: (row.topics ?? []) as UserProfile["topics"],
    createdAt: row.created_at,
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as DbProfileRow) : null;
}

export async function upsertProfile(
  userId: string,
  profile: UserProfile,
): Promise<UserProfile> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        display_name: profile.displayName ?? null,
        age_range: profile.ageRange,
        occupation: profile.occupation,
        state: profile.state,
        income_bracket: profile.income,
        household: profile.household,
        topics: profile.topics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToProfile(data as DbProfileRow);
}

export async function deleteProfile(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("profiles").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export type ProfileWithUserId = UserProfile & { userId: string };

// Used by cron jobs to fan out across all users with profiles.
export async function listAllProfiles(): Promise<ProfileWithUserId[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.from("profiles").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...rowToProfile(row as DbProfileRow),
    userId: row.user_id as string,
  }));
}
