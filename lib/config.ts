// Central place for "is this service configured?" flags. Server-side only.
// Used by API routes and middleware to gracefully degrade when env vars are
// unset, so the app keeps running before Clerk/Supabase/Gemini are wired up.

export const isClerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isGeminiConfigured = !!process.env.GEMINI_API_KEY;

export const NOT_CONFIGURED = "not_configured";
