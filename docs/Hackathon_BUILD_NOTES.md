# OpenComment — Build Notes

> Hackathon demo. A civic tool that surfaces open federal proposed rules personalized to an ordinary American's life, and helps them put a substantive comment on the official record.

---

## TL;DR

Three-screen demo (Onboarding → Feed → Detail) built on Next.js 14, talking to the **real regulations.gov v4 API** for the feed, with everything else (auth, submission, LLM generation) faked but presentable. Core narrative works end-to-end. Designed for a 90-second walkthrough.

---

## What's done

| Area | State | Notes |
|---|---|---|
| Project scaffolding | ✅ | Next.js 14 App Router, TS, Tailwind, Framer Motion, Lucide |
| Design system | ✅ | Warm cream + deep navy + saffron accent. Fraunces serif headings, Inter Tight body. Editorial / civic aesthetic — not SaaS. |
| Landing page | ✅ | Hero, sample card, three-step explainer, stats pull-quote, footer. Auto-redirects to `/feed` if profile exists. |
| Onboarding flow | ✅ | 3 animated steps (Identity → Household → Issues). Progress bar, choice grids, topic chips with icons. Saves to `localStorage` via React Context. |
| Feed | ✅ | Sticky nav, vertical card list, agency badges, % match, deadlines, topic chips, skeleton loaders, right-rail with stats + filters + agency leaderboard. |
| Regulation detail | ✅ | Hero header, two-column layout, plain-language summary, key provisions, official excerpt, "why this is in your feed" panel, prominent "Open on regulations.gov ↗". |
| Generated comment composer | ✅ | Personalized 350–500 word draft anchored to profile (occupation, state, household, age, income). Three tonal variants (Balanced / Shorter / More personal) with simulated regen animation. Animated Copy → Copied ✓. Word count. |
| API proxy + caching | ✅ | Server-side route handler hides API key, 5-min in-memory cache. |
| Live regulations.gov data | ✅ | Pulls 250 most-recent open Proposed Rules per request. |
| Topic ranking | ✅ | Client-side keyword overlap + agency mapping + recency/urgency bumps. |
| Empty/error states | ✅ | Differentiates "API unreachable" from "no matches in your topics." |
| Rebrand | ✅ | "Public Comment Amplifier" → "OpenComment" everywhere except the FRD. |

---

## What's real

- **Federal docket data.** `app/api/regulations/route.ts` calls `https://api.regulations.gov/v4/documents` for currently-open Proposed Rules sorted by recency. Real document IDs, real titles, real comment-end dates, real frontend URLs.
- **The "Open on regulations.gov" link.** Goes to the actual document page on the federal site; user clicks → official page → can paste their comment into the real submission box.
- **Topic ranking.** Keyword overlap and agency-to-topic mapping (CMS → Healthcare, EPA → Environment, etc.) are computed against the live API response.
- **Profile persistence.** Saved to `localStorage`. Survives reloads. No server, no account.
- **API key security.** Lives in `.env.local` (gitignored) and is only ever read server-side; never reaches the client bundle.
- **Caching.** 5-minute in-memory cache on the API route — second request typically returns in <10ms (verified).

## What's faked or stubbed

- **Auth.** No accounts, no sign-up, no email. `localStorage` only.
- **Comment submission.** We never POST anywhere. The flow is: copy → click out to regulations.gov → paste → user submits manually. (Per the FRD — the official comment box is the source of truth.)
- **LLM comment generation.** Comments are built by [`lib/mock/commentTemplates.ts`](lib/mock/commentTemplates.ts) — string interpolation with profile data into hand-written paragraph templates that branch on age, income, household, etc. Three pre-written tonal variants (Balanced / Shorter / More personal). The "regenerating…" skeleton between variants is a 380ms timeout.
- **Search bar** in the feed header is visual-only (placeholder text included, "Demo · Visual only" label was originally there).
- **Right-rail stats** ("1,243 active right now", "87 tied to your state", state name lookup). The 1,243 figure is decorative; only the agency leaderboard is computed from the actual feed.
- **Save / Share buttons** on the detail page are visual-only.
- **Mock regulations file** ([`lib/mock/regulations.ts`](lib/mock/regulations.ts)) — 10 hand-crafted entries are still on disk but **no longer wired up**. They were the original "never blank" fallback, but their docket IDs are fabricated, so their `regulations.gov/document/...` URLs 404. Per user direction, we removed the fallback entirely.

## What doesn't work / known gaps

- **Veterans / Small Business / Immigration profiles** sometimes return 0 matches. This is **the real federal docket** — those agencies have few currently-open proposed rules at any given time. The empty state is honest, not a bug.
- **No browser-tested interactions.** Compilation and HTTP responses verified; spacing, animation timing, copy-to-clipboard fallback, and form-validation edge cases were not driven through a real browser before handoff. Worth a 60-second click-through before demoing.
- **Regulations.gov frontend bot-protection (403 on server-side fetch)** means we can't HEAD-validate URLs from the route handler. We trust API-returned IDs instead — they're canonical and resolve in real browsers.
- **No tests.** Zero. Not in scope for a hackathon demo, but worth flagging.
- **Mobile not optimized.** Designed for laptop demo per FRD §4. Header, two-column layouts, and right-rail collapse on smaller screens but were not styled for mobile.

---

## Technical decisions worth knowing

### `searchTerm` filter dropped
The v4 API's `filter[searchTerm]` does whole-word matching: `healthcare` returns 0 hits while `health` returns 10. Joining multiple topics into one search string AND-combined them and yielded near-empty results. Replaced with: pull all 250 open Proposed Rules → rank client-side via keyword overlap + agency mapping. More API quota use, dramatically better coverage.

### URL HEAD validation removed
Initial design HEAD-checked each returned document URL to filter out 404s. Discovery: regulations.gov's *frontend* (not the API) returns 403 for all server-side requests due to bot protection — so HEAD-checking can't distinguish good URLs from bad. Trusting API-returned IDs is the correct move; users hitting the URL from a real browser get the actual page.

### Mock-fallback blending removed
Original FRD spec said "if API returns nothing, fall back to a hardcoded list of 6–8 mock regulations so the demo never shows a blank screen." We had 10 hand-crafted ones with realistic-looking but fabricated docket IDs. Problem: those URLs 404. Per user direction, removed the blend — now if the API fails, the feed shows a clear "couldn't reach regulations.gov" empty state with no fake documents.

### Page size = 250
API max. Bumped up from 50 because Healthcare-only profiles got 0 matches when the latest 50 docs were dominated by EPA/PHMSA filings. With 250 docs in the pool, Healthcare nets ~10, Labor ~8, Environment ~56, etc.

### Topic inference is hybrid
For each API document, `mapApiResponse()` infers topics from **(a)** agency ID via a hand-curated `AGENCY_TO_TOPICS` map (CMS → Healthcare, PHMSA → Environment, etc.) and **(b)** keyword scan of title + abstract. Both signals union together. This catches both "obvious" docs (an HHS rule must be healthcare-adjacent even if "health" isn't in the title) and "topical" docs (a Treasury rule about housing policy).

### Comment template approach
Instead of an LLM call, [`buildComment()`](lib/mock/commentTemplates.ts) uses branching string templates that switch on:
- Occupation (with `a/an` article correction)
- State (full names from a 51-entry map including DC)
- Age range (different framing for 18–34 vs 65+)
- Income bracket (different framing for under-$50k vs $100k+)
- Household status (parent vs solo vs multi-generational)
- Up to 3 of the regulation's specific provisions

For a real-LLM demo, the swap-in point is `GeneratedComment.tsx` — replace the `useMemo(() => buildComment(...))` with a `fetch('/api/draft-comment')` call. Plumbing's there.

### Server-side API proxy
The route handler at `app/api/regulations/route.ts` is the only place the regulations.gov API key is read. Client never sees it. Standard pattern.

### Profile state via React Context
Single `ProfileContext` provider hydrates from `localStorage` on mount, exposes `{ profile, hydrated, setProfile, reset }`. Pages that need a profile redirect to `/onboarding` if `hydrated && !profile`. This avoids the flicker of "no profile" state on initial render.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables for the palette |
| Fonts | `next/font/google` — Fraunces (display) + Inter Tight (body) |
| Icons | Lucide React |
| Animation | Framer Motion |
| State | React Context + `localStorage` |
| Data | regulations.gov v4 API (live) + in-memory 5-min cache |
| Deployment | Designed for Vercel — single command |

---

## File map

```
app/
  page.tsx                    # Landing
  onboarding/page.tsx         # 3-step form
  feed/page.tsx               # Personalized feed
  regulation/[id]/page.tsx    # Detail + comment composer
  api/regulations/route.ts    # Server proxy to regulations.gov
  layout.tsx, globals.css     # Fonts, theme, providers

components/
  shared/{Logo, AgencyBadge}.tsx
  onboarding/{ProgressBar, Field, TopicChips}.tsx
  feed/{FeedHeader, RegulationCard, TrendingRail}.tsx
  regulation/{GeneratedComment, CopyButton}.tsx

lib/
  types.ts                    # UserProfile, Regulation, Topic
  profile.ts                  # localStorage I/O
  ranking.ts                  # Keyword + agency scoring
  regulationsApi.ts           # Query builder + API response mapper
  mock/regulations.ts         # Unwired (fabricated IDs)
  mock/commentTemplates.ts    # Template-based comment generator

context/ProfileContext.tsx    # Profile provider
```

---

## How to run

```bash
cd PublicCommentAmplifier
npm install     # only first time
npm run dev     # opens on http://localhost:3000 (or 3001+ if taken)
```

`.env.local` already has the API key. The app will fall back to `DEMO_KEY` if missing — works for low-volume use but rate-limits faster.

---

## Demo script (90 seconds)

1. **0:00 – 0:15** — Landing → "Get started." Walk through onboarding as a *home health aide in Ohio*, select **Healthcare + Labor**.
2. **0:15 – 0:35** — Land on feed. Scroll. Note the variety of agencies (CMS, DOL, HHS, OSHA). Point out the % match badges.
3. **0:35 – 1:00** — Click into the top card. Show the plain-language summary on the left and the **fully drafted comment** on the right — already in the user's voice, citing their occupation and state.
4. **1:00 – 1:20** — Click **Copy comment** (button flips to "Copied ✓"). Click **Open on regulations.gov ↗** — the *real federal page* opens in a new tab. *"Paste, submit, done."*
5. **1:20 – 1:30** — Closing line: *"Every comment is anchored to a real person. We're not generating astroturf — we're closing the access gap."*

---

## What we'd build next (if the hackathon kept going)

- Real LLM generation at runtime, with a pre-warm cache so the comment is visible immediately on detail-page load.
- "Comments like yours" — show 2–3 anonymized prior comments from the same docket via the API's `/comments` endpoint.
- One-click "send me an email when comment periods close in <topic>" — light email capture, single transactional reminder.
- PDF export of your comment with letterhead and signature line for users who prefer to mail it.
- Postal-mail submission for users without internet — print-ready envelope + agency address.
