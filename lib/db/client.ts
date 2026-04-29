import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../config";

let cached: SupabaseClient | null = null;

// Server-only Supabase client using the service-role key. All Phase 1 DB
// access goes through server-side route handlers, so RLS is intentionally
// bypassed here. RLS is enabled but no policies exist; we'll add policies
// before any client-side query is made.
//
// Returns null when Supabase isn't configured. Callers must handle null
// (typically by falling back to localStorage on the frontend).
export function supabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}
