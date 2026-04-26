# OpenComment

OpenComment helps ordinary Americans find federal proposed rules that affect their lives and submit substantive public comments to the official record at regulations.gov.

This repository is the Phase 1 production build: real LLM-drafted comments, persistent saved/commented state, magic-link auth, and Vercel deployment. See [`docs/`](docs/) for the full FRD and project plan.

## Mission

Trade associations and lobbyists routinely participate in federal rulemaking. Ordinary citizens almost never do, despite having the legal right and a meaningful potential impact. OpenComment closes that gap.

Three commitments shape every product decision:

- **Anti-astroturf by construction.** Every comment is anchored to a real, signed-in user's lived situation, drafted from facts they entered, and submitted by them through their own session on regulations.gov. The product never auto-submits and never generates identical text across users.
- **Privacy as primary UX.** Layered consent, plain-English data controls, and one-click deletion are core product surfaces, not legal afterthoughts.
- **Outputs that don't read as AI.** Every LLM surface ships with a tuned system prompt, a banned-phrase post-processor, and a quality gate.

## Phase 1 features

- Magic-link sign-in via Clerk (with localStorage fallback when keys aren't set)
- Profile, saved-rules, commented-rules, regulation cache, and email preferences in Supabase Postgres
- Gemini-powered comment drafting with three structural variants and an em-dash + banned-phrase quality gate
- Gemini-powered plain-language summaries (3 paragraphs) and key provisions on the detail page
- Gemini-powered one-line feed summaries warmed nightly via Vercel Cron and cached forever per document
- Personalized "why this is in your feed" generated on demand
- Hybrid feed search: server-side `filter[searchTerm]` first, client-side substring fallback for fuzzy matches
- Filter rail: agency, topic, deadline urgency, match score, state relevance
- 102 federal agencies mapped to topics for richer feed coverage
- 13 topics (added Civil Rights, Tax & Finance, Public Safety, Consumer Protection)
- Settings hub: profile editor, email preferences, privacy & data (export + one-click delete)
- Privacy policy and terms of service pages

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Auth | Clerk (magic-link) |
| Database | Supabase Postgres |
| LLM | Gemini 2.5 Flash via `@google/generative-ai` |
| Federal data | regulations.gov v4 API |
| Cron | Vercel Cron |
| Styling | Tailwind + CSS variables |
| Animation | Framer Motion |
| Icons | Lucide React |

## Run locally

```bash
npm install
cp .env.local.example .env.local
# Fill in any keys you have — see "Optional service setup" below.
npm run dev
```

Open http://localhost:3000.

The app degrades gracefully when service keys aren't set:

| Service | Without key | With key |
|---|---|---|
| Clerk | Profile in localStorage; sign-in pages show a "not configured" message | Real magic-link auth, multi-device profile sync |
| Supabase | All persistence in localStorage; activity/saved/commented work on this device only | Full Postgres-backed persistence and account export/delete |
| Gemini | Template-based comment drafting; truncated rule abstracts; static "why in feed" copy | Real LLM-drafted comments, plain-language summaries, key provisions, personalized "why" |

You can run with any combination — e.g., Gemini on but Supabase off — and each surface degrades independently.

## Optional service setup

### regulations.gov API key

The app uses `DEMO_KEY` if no key is set. For production traffic, get a free key:

```bash
# https://api.data.gov/signup/
REGULATIONS_GOV_API_KEY=your_key_here
```

### Clerk (auth)

1. Create an application at https://dashboard.clerk.com
2. Copy the publishable key and secret key into `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Restart the dev server. Sign-in / sign-up routes now use Clerk's hosted UI; protected routes (`/feed`, `/saved`, `/activity`, `/settings`) require auth.

### Supabase (database)

1. Create a project at https://supabase.com
2. Copy the project URL and keys into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

3. Apply the migration:

```bash
# In the Supabase SQL editor, paste the contents of:
# supabase/migrations/0001_phase1.sql
```

This creates `profiles`, `saved_regulations`, `commented_regulations`, `regulation_cache`, and `email_preferences`.

### Gemini (LLM)

1. Get an API key at https://aistudio.google.com/apikey
2. Set in `.env.local`:

```bash
GEMINI_API_KEY=AIza...
```

The app uses `gemini-2.5-flash` for all surfaces. To swap to Pro, edit `MODEL` in `app/api/llm/comment/route.ts` and `app/api/llm/summary/route.ts`.

### Cron secret (only needed for non-Vercel cron triggers)

The nightly summary-warming cron runs automatically on Vercel via the schedule in `vercel.json`. To trigger it manually (e.g., for local testing), set:

```bash
CRON_SECRET=any_random_string
```

Then call `curl -H "Authorization: Bearer any_random_string" http://localhost:3000/api/cron/warm-summaries`.

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo at https://vercel.com/new — accept defaults.
3. In the Vercel project settings, add every variable from your `.env.local` (the same keys, the same values). Each must be set per-environment (Production, Preview, Development).
4. Redeploy.
5. The nightly cron in `vercel.json` runs automatically; the first 24 hours after deploy will show truncated abstracts on cards while the cache warms.

Custom domain is deferred for Phase 1; the deploy lives at `<project>.vercel.app`.

## Repo layout

```text
app/
  page.tsx                       Landing
  onboarding/page.tsx            Three-step civic profile
  feed/page.tsx                  Personalized + searchable + filterable feed
  regulation/[id]/page.tsx       Detail with LLM summary, provisions, comment
  saved/page.tsx                 Bookmarked rules
  activity/page.tsx              Commented + saved-then-closed timeline
  settings/                      Hub + profile + email + privacy
  privacy/, terms/               Public policy pages
  sign-in/, sign-up/             Clerk catch-all routes
  api/
    regulations/                 Federal-docket proxy with searchTerm support
    profile/                     Profile CRUD
    saved/                       Saved-rules CRUD
    commented/                   Commented-rules CRUD
    email-preferences/           Email prefs CRUD
    account/                     Export + delete
    llm/{comment,summary,why}/   Gemini endpoints
    cron/warm-summaries/         Nightly LLM summary backfill
components/
  feed/                          Header, card, filter rail, trending rail
  regulation/                    Comment composer, copy button
  onboarding/                    Form primitives, topic chips
  shared/                        Logo, agency badge, auth shell
context/ProfileContext.tsx       Server-or-localStorage profile sync
hooks/
  useSavedRegulations.ts         Save state with optimistic updates
  useCommentedRegulations.ts     Commented state + paste-back
lib/
  llm/                           Gemini client + prompts + postprocessor
  db/                            Supabase admin queries (profiles, saved, …)
  ranking.ts                     Keyword + agency + recency + urgency scorer
  regulationsApi.ts              v4 URL builder + response mapper
  config.ts                      isClerkConfigured / isSupabaseConfigured / …
  auth.ts                        currentUserId() server helper
  types.ts                       Topic, UserProfile, Regulation, ScoredRegulation
middleware.ts                    Clerk middleware (passthrough when unconfigured)
supabase/migrations/             SQL schema for Phase 1
docs/                            FRD, project plan, build notes
vercel.json                      Cron schedule
```

## Out of scope (deferred to later phases)

- Email digest sending, closing-soon alerts, final-rule detection (Phase 2)
- Embeddings, story bank, free-text onboarding context (Phase 3)
- Direct submission via the regulations.gov POST API, edit-assist, comments-like-yours (Phase 4)
- Custom domain
- Sentry / PostHog observability
- Counsel review of the privacy policy and terms

## License

TBD.
