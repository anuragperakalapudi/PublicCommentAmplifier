import { supabaseAdmin } from "./client";

export interface EmailPreferences {
  digestFrequency: "daily" | "weekly" | "off";
  digestTime: string; // "HH:MM"
  timezone: string;
  closingSoonAlerts: boolean;
  finalRuleAlerts: boolean;
  mutedTopics: string[];
  quietHoursStart?: string | null; // "HH:MM" or null
  quietHoursEnd?: string | null;
  emailAddress?: string | null; // override; falls back to Clerk primary
}

export const DEFAULT_PREFS: EmailPreferences = {
  digestFrequency: "weekly",
  digestTime: "09:00",
  timezone: "America/New_York",
  closingSoonAlerts: true,
  finalRuleAlerts: true,
  mutedTopics: [],
  quietHoursStart: null,
  quietHoursEnd: null,
  emailAddress: null,
};

interface DbPrefsRow {
  user_id: string;
  digest_frequency: string;
  digest_time: string;
  timezone: string;
  closing_soon_alerts: boolean;
  final_rule_alerts: boolean;
  muted_topics: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  email_address: string | null;
}

function rowToPrefs(row: DbPrefsRow): EmailPreferences {
  return {
    digestFrequency: (row.digest_frequency ??
      "weekly") as EmailPreferences["digestFrequency"],
    digestTime: (row.digest_time ?? "09:00").slice(0, 5),
    timezone: row.timezone ?? "America/New_York",
    closingSoonAlerts: row.closing_soon_alerts ?? true,
    finalRuleAlerts: row.final_rule_alerts ?? true,
    mutedTopics: row.muted_topics ?? [],
    quietHoursStart: row.quiet_hours_start
      ? row.quiet_hours_start.slice(0, 5)
      : null,
    quietHoursEnd: row.quiet_hours_end ? row.quiet_hours_end.slice(0, 5) : null,
    emailAddress: row.email_address,
  };
}

export async function getEmailPreferences(
  userId: string,
): Promise<EmailPreferences> {
  const sb = supabaseAdmin();
  if (!sb) return DEFAULT_PREFS;
  const { data, error } = await sb
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToPrefs(data as DbPrefsRow) : DEFAULT_PREFS;
}

export async function upsertEmailPreferences(
  userId: string,
  prefs: EmailPreferences,
): Promise<EmailPreferences> {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("email_preferences")
    .upsert(
      {
        user_id: userId,
        digest_frequency: prefs.digestFrequency,
        digest_time: prefs.digestTime,
        timezone: prefs.timezone,
        closing_soon_alerts: prefs.closingSoonAlerts,
        final_rule_alerts: prefs.finalRuleAlerts,
        muted_topics: prefs.mutedTopics,
        quiet_hours_start: prefs.quietHoursStart || null,
        quiet_hours_end: prefs.quietHoursEnd || null,
        email_address: prefs.emailAddress || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToPrefs(data as DbPrefsRow);
}

// Used by cron jobs to fan out per-user. Returns the row when present so the
// cron can short-circuit on `digest_frequency = 'off'` etc.
export async function listAllEmailPreferences(): Promise<
  Array<EmailPreferences & { userId: string }>
> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.from("email_preferences").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...rowToPrefs(row as DbPrefsRow),
    userId: row.user_id as string,
  }));
}
