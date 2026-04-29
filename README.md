# OpenComment

A civic web application that surfaces federal proposed rules from regulations.gov, ranks them against a user's profile, and helps the user submit a substantive public comment to the federal record.

Stack: Next.js 14 App Router, TypeScript, Clerk, Supabase Postgres, Gemini, Vercel Cron, Resend.

## Status

| Surface | Status |
|---|---|
| Phase 1 (auth, persistence, LLM drafting, summaries, save/commented, search, filters, settings, privacy/terms) | Shipped |
| Phase 2 (digest email, closing-soon alerts, final-rule detection) | Shipped, dormant until `RESEND_API_KEY` is provisioned |
| Phase 3 (free-text context, story bank, embeddings, multi-state) | Not started |
| Phase 4 (edit-assist, direct submission, comments-like-yours) | Not started |

Each external service (Clerk, Supabase, Gemini, Resend) has a graceful fallback. Routes that require an unconfigured service return HTTP 501 and the UI degrades to a localStorage-only equivalent. Production functionality requires all four to be provisioned.

## Architecture

```
Browser  ──► Next.js App Router (Vercel)
              │
              ├─ Middleware: Clerk session gate
              │
              ├─ Pages: /, /onboarding, /feed, /regulation/[id],
              │         /saved, /activity, /settings/*, /privacy, /terms,
              │         /sign-in, /sign-up
              │
              └─ API routes:
                   /api/regulations          regulations.gov v4 proxy + cache
                   /api/profile              profile CRUD
                   /api/saved                saved-rules CRUD
                   /api/commented            commented-rules CRUD
                   /api/email-preferences    user email prefs CRUD
                   /api/account              JSON export + account delete
                   /api/llm/{comment,summary,why}
                                             Gemini endpoints with quality gate
                   /api/email/unsubscribe    RFC 8058 one-click unsubscribe
                   /api/cron/warm-summaries  nightly LLM short-summary backfill
                   /api/cron/digest          digest fan-out
                   /api/cron/closing-soon    7/3/1-day deadline alerts
                   /api/cron/final-rule      docket polling for final rules
                   /api/final-rule-events    feeds the activity timeline

External services
  Clerk          Magic-link auth, user identity
  Supabase       Postgres for profiles, save/commented state, LLM cache,
                 email preferences, docket watch list, email send log
  Gemini         text-embedding (Phase 3) and gemini-2.5-flash for prose
  regulations.gov v4 API
                 Federal docket data
  Resend         Transactional email; Phase 2 only
```

LLM output passes through a postprocessor (`lib/llm/postprocess.ts`) that strips em dashes, flags banned phrases, enforces a 35-word sentence ceiling, and retries up to twice before surfacing the result with quality-gate flags for the user to review.

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Populate .env.local with the keys listed below; any missing key triggers
# graceful degradation rather than a hard failure.
npm run dev
```

The dev server runs at `http://localhost:3000`. First request after a cold start in dev mode triggers a Webpack compile and may take 10 to 20 seconds; subsequent navigations are sub-second.

## Configuration

All env vars are documented in [`.env.local.example`](.env.local.example). Names and purposes:

| Variable | Required for | Notes |
|---|---|---|
| `REGULATIONS_GOV_API_KEY` | Production traffic | Falls back to `DEMO_KEY` (rate-limited). Free at https://api.data.gov/signup/. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth | Public, ships in client bundle. Free tier covers 10k MAU. |
| `CLERK_SECRET_KEY` | Auth | Server-side only. |
| `NEXT_PUBLIC_SUPABASE_URL` | Persistence | Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Persistence | Public. RLS protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Persistence | Server-side only. Bypasses RLS for trusted route handlers. |
| `GEMINI_API_KEY` | LLM features | Free tier: 15 RPM, 1500 RPD on Flash. |
| `RESEND_API_KEY` | Phase 2 email | Free tier: 3000 emails/month, 100/day. |
| `RESEND_FROM_EMAIL` | Phase 2 email | Must be a verified Resend sender. Defaults to `OpenComment <hello@opencomment.org>`. |
| `NEXT_PUBLIC_APP_URL` | Email link generation | Set to the canonical deploy URL in production. |
| `CRON_SECRET` | Manual cron triggers | Optional. Vercel Cron auto-authenticates via the `x-vercel-cron` header. |

Vars prefixed with `NEXT_PUBLIC_` are inlined into the client bundle at build time. All other vars stay server-side.

## Database

The app expects three migrations to have been applied to the Supabase project, in order:

1. [`supabase/migrations/0001_phase1.sql`](supabase/migrations/0001_phase1.sql): `profiles`, `saved_regulations`, `commented_regulations`, `regulation_cache`, `email_preferences`.
2. [`supabase/migrations/0002_display_name.sql`](supabase/migrations/0002_display_name.sql): adds `profiles.display_name`.
3. [`supabase/migrations/0003_phase2.sql`](supabase/migrations/0003_phase2.sql): `docket_watch`, `email_log`; adds `regulation_cache.docket_id`, plus quiet-hours and email-address columns on `email_preferences`.

Apply each via the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run). When prompted, select **Run and enable RLS**. The application accesses Supabase exclusively through the service-role key, which bypasses RLS, so existing queries continue to function. Enabling RLS prevents the public anon key from reading or writing the tables.

No migration runner is bundled. Future migrations should be applied in numeric order before deploying any code that depends on them.

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the repo at https://vercel.com/new. Accept the auto-detected Next.js framework settings.
3. Under **Project Settings → Environment Variables**, add every variable from `.env.local`. Set each one for **Production**, **Preview**, and **Development** so PR previews and local Vercel CLI runs work.
4. Set `NEXT_PUBLIC_APP_URL` to the canonical deploy URL. Without it, email links resolve to `http://localhost:3000`.
5. Apply the three Supabase migrations if not already applied.
6. Deploy.

### Cron jobs

`vercel.json` declares four daily crons:

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/cron/warm-summaries` | `0 8 * * *` | Generates LLM short summaries for newly-posted rules; idempotent. |
| `/api/cron/digest` | `0 13 * * *` | Fans out personalized digest emails to eligible users. |
| `/api/cron/closing-soon` | `0 12 * * *` | Sends 7-day, 3-day, and 1-day deadline reminders for saved rules. |
| `/api/cron/final-rule` | `30 9 * * *` | Polls dockets the user has engaged with and emails when a final rule is published. |

Vercel Hobby permits daily-frequency cron only. To honor user-specific `digest_time` preferences (which require hourly fan-out), upgrade to Pro or proxy the digest route from an external scheduler (e.g., cron-job.org) authenticated with `CRON_SECRET`.

The `final-rule` route caps polling at 60 dockets per invocation to stay within the regulations.gov 1000-requests-per-hour limit.

### Custom domain

Not currently configured. The deploy lives at `<project>.vercel.app`. Adding a custom domain is a project setting on Vercel; once configured, update `NEXT_PUBLIC_APP_URL` and the Resend sender domain to match.

## Local development

```bash
npm run dev          # Next.js dev server with HMR
npm run build        # Production build (Next.js compiler + ESLint + tsc)
npm run lint         # ESLint via next lint
npm start            # Serve the production build
npx tsc --noEmit     # Type-check without emitting
```

To trigger a cron route manually for testing, set `CRON_SECRET` in `.env.local` and invoke:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/warm-summaries
```

## Project structure

```
app/
  page.tsx                       Landing
  onboarding/page.tsx            Three-step civic profile flow
  feed/page.tsx                  Personalized, searchable, filterable feed
  regulation/[id]/page.tsx       Rule detail with LLM summary and composer
  saved/page.tsx                 Bookmarked rules
  activity/page.tsx              Commented, saved-closed, final-rule timeline
  settings/                      Hub + profile + email + privacy
  privacy/, terms/               Public policy pages
  sign-in/, sign-up/             Clerk catch-all routes
  api/
    regulations/                 Federal-docket proxy with hybrid search
    profile/, saved/, commented/, email-preferences/, account/
                                 CRUD endpoints
    llm/{comment,summary,why}/   Gemini endpoints with quality gate
    final-rule-events/           Feeds the activity timeline
    email/unsubscribe/           RFC 8058 one-click unsubscribe
    cron/{warm-summaries,digest,closing-soon,final-rule}/
                                 Vercel-scheduled jobs

components/
  feed/                          Header, card, filter rail, trending rail
  regulation/                    Comment composer, copy button
  onboarding/                    Form primitives, topic chips, progress bar
  shared/                        Logo, agency badge, auth shell

context/ProfileContext.tsx       Server-then-localStorage profile sync

hooks/
  useSavedRegulations.ts
  useCommentedRegulations.ts

lib/
  llm/                           Gemini client + prompts + postprocessor
  db/                            Supabase admin queries
  email/                         Resend wrapper, send log, HTML+text templates
  ranking.ts                     Scoring (keyword + agency + recency + urgency)
  regulationsApi.ts              v4 URL builder + response mapper
  config.ts                      Service-configured flags
  auth.ts                        Server-side currentUserId / getUserEmail
  cron-auth.ts                   Cron route authentication helpers
  types.ts                       Topic, UserProfile, Regulation, etc.

middleware.ts                    Clerk middleware; passthrough when unconfigured
supabase/migrations/             Numeric SQL migrations
docs/                            FRD, project plan, build notes
vercel.json                      Cron schedule
```

## Design principles

1. **No auto-submission.** The application never POSTs comments to regulations.gov. The user copies the draft, opens regulations.gov in a new tab, and submits manually under their own session.
2. **Profile-anchored output.** LLM-drafted comments cite the user's profile fields and (when present) their personal stories. Drafts are not generated for unauthenticated visitors.
3. **Anti-AI tells.** Every LLM surface is post-processed to strip em dashes, banned phrases, and overlong sentences. Failed gates trigger up to two regenerations before surfacing with a flag.
4. **Graceful degradation.** Each external dependency has a configured-flag check. Missing configuration produces a clear "not configured" response rather than a runtime failure.
5. **Private by default.** All third-party traffic is server-side. The anon Supabase key is RLS-protected. Account deletion is one click and cascades across all tables.

## Out of scope

The following are intentionally not part of the current build and are tracked in `docs/FRD.md`:

- Comment submission via the regulations.gov POST API (Phase 4)
- AI-assisted comment editing with inline annotations (Phase 4)
- "Comments like yours" preview from `/v4/comments` (Phase 4)
- Embedding-based semantic ranking, story bank, multi-state support, adaptive interview (Phase 3)
- Profile picture upload (FRD §3.2 Tier 4)
- Match-score distribution sparkline above the slider (FRD §3.3)
- Sentry / PostHog observability
- Counsel review of `/privacy` and `/terms`

## License

Not yet specified.
