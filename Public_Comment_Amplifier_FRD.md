# Public Comment Amplifier — Functional Requirements Document (FRD)

**Project Type:** Hackathon Demo (Presentational MVP)
**Version:** 0.1
**Last Updated:** April 24, 2026

---

## 1. Overview

Public Comment Amplifier gives ordinary Americans the same access to federal rulemaking that lobbyists already have. Users describe their situation in plain English; the platform surfaces relevant open regulations and helps them draft substantive public comments anchored to their lived experience.

**This document scopes the hackathon demo only.** The goal is a polished, presentable frontend that *looks* like a working product. The feed is powered by the real regulations.gov API; everything else (auth, ranking, comment generation, submission) is faked or stubbed.

---

## 2. Demo User Flow

The demo follows a strict three-screen narrative:

1. **Onboarding** → user enters demographics + topics of interest
2. **Feed (Home)** → personalized scroll of regulations ranked by profile fit
3. **Regulation Detail** → full regulation view with link to regulations.gov + auto-generated comment template

---

## 3. Functional Requirements

### 3.1 Onboarding Screen
- Multi-step form (2–3 steps) collecting:
  - **Demographics:** age range, occupation, location (state), income bracket, household status
  - **Interests/Topics:** multi-select chips (e.g., Healthcare, Housing, Labor, Disability, Immigration, Environment, Education, Veterans, Small Business)
- Progress indicator across steps
- "Save profile" persists to `localStorage` (no real backend)
- Smooth transition into the feed on completion

### 3.2 Feed (Home) Screen
- Twitter/X-inspired vertical feed of regulation "cards"
- **Real data:** on feed load, the app calls the **regulations.gov v4 API** (`/v4/documents`) using the user's onboarding selections to build the search query (see 3.4 below). Results are mapped directly to feed cards.
- Each card displays:
  - Agency badge (e.g., HHS, DOL, HUD) — from `agencyId`
  - Regulation title — from `title`
  - 1–2 sentence plain-English summary — from `docAbstract` if present, else truncated `title` + `documentType`
  - Comment period deadline — from `commentEndDate` (rendered as "Closes in 12 days")
  - Relevance indicator — derived locally from how many of the user's interest tags appear in the title/abstract (simple keyword overlap, no ML)
  - CTA button ("Read & comment")
- Cards link to the regulation detail page using the API's `id` field
- Sticky top nav with logo, search bar (visual only for the demo), and profile avatar
- Optional left/right rails for visual richness (trending topics, your filters)
- **Loading state:** skeleton cards while the API call resolves
- **Empty/error fallback:** if the API call fails or returns nothing, fall back to a hardcoded list of 6–8 mock regulations so the demo never shows a blank screen

### 3.3 Regulation Detail Screen
- Header with agency, title, deadline, and a prominent **"Open on regulations.gov ↗"** button that links out to the real regulation page in a new tab — this is how users actually submit
- Two-column layout (collapses to single column on mobile):
  - **Left:** plain-language summary, key provisions affecting the user (highlighted), official document excerpt
  - **Right:** **Generated Comment** — an LLM-drafted public comment (~300–450 words) personalized to the user's profile and the specific regulation. Pre-filled in a styled, read-only-feeling block with a clear monospace or document aesthetic to signal "this is a draft document"
- **"Copy comment"** button at the top-right of the comment block → copies to clipboard, button briefly flips to "Copied ✓"
- Below the comment, a clear instruction line: *"Copy this comment, then paste it into the official comment box on regulations.gov."*
- Optional: a small "Regenerate" or "Make it shorter / longer / more personal" affordance for demo flair (can be faked with 2–3 pre-written variants)
- Word count displayed below the comment block

### 3.4 regulations.gov API Integration

**Endpoint used:** `GET https://api.regulations.gov/v4/documents`

**Auth:** `X-Api-Key` header. Use a free API key from api.data.gov; `DEMO_KEY` is fine for the hackathon if rate limits hold.

**Query construction (kept deliberately simple):**
- Join the user's selected interest topics into a single space-separated string and pass as `filter[searchTerm]`
  - e.g., interests `["Healthcare", "Labor"]` → `filter[searchTerm]=healthcare labor`
- Restrict to currently open comment periods: `filter[commentEndDate][ge]=<today>`
- Only proposed/final rules (skip supporting material): `filter[documentType]=Proposed Rule`
- Sort newest first: `sort=-postedDate`
- Page size: `page[size]=20`

**Example request:**
```
GET https://api.regulations.gov/v4/documents
  ?filter[searchTerm]=healthcare%20labor
  &filter[documentType]=Proposed%20Rule
  &filter[commentEndDate][ge]=2026-04-24
  &sort=-postedDate
  &page[size]=20
Headers: X-Api-Key: <YOUR_KEY>
```

**Where the call lives:** a single Next.js Route Handler at `app/api/regulations/route.ts` so the API key stays server-side. The feed page fetches from this internal route on mount.

**Rate limits:** GET endpoints are 1,000 requests/hour with a registered key, plenty for a demo. Cache the response in memory for 5 minutes to be safe.

---

## 4. Non-Functional / Presentation Requirements

- **Aesthetic:** modern, civic, trustworthy — think *NYTimes meets Linear meets Twitter*. Serif display font for headings, clean sans for body. Restrained palette with one strong accent (e.g., deep navy + warm cream + a single saffron/amber accent). Avoid generic purple gradients.
- **Responsive:** must look clean on a laptop screen during the demo (mobile is nice-to-have)
- **Performance:** instant page transitions; no loading spinners visible during the demo
- **Mock data:** 6–10 hand-crafted regulations covering a spread of agencies and topics so any reasonable demo profile produces a believable feed

---

## 5. Out of Scope (For Demo)

- Real authentication / user accounts
- Real ranking/relevance algorithm beyond simple keyword overlap
- Real comment submission (we link out to regulations.gov instead)
- Live LLM generation at runtime (use pre-written, profile-matched comment drafts; can swap to a real API call later)
- Admin panel, analytics, moderation

---

## 6. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Fast setup, file-based routing, easy deployment to Vercel for live demo link |
| Language | **TypeScript** | Type safety on mock data shapes |
| Styling | **Tailwind CSS** + CSS variables | Speed without sacrificing custom design |
| UI Primitives | **shadcn/ui** (selectively) | For form, dialog, badge components — restyled to match brand |
| Icons | **Lucide React** | Clean, civic-appropriate icons |
| Fonts | **Fraunces** (display serif) + **Inter Tight** (body) via `next/font` | Distinctive but trustworthy |
| State | **React Context** + `localStorage` | Sufficient for faked profile persistence |
| Animation | **Framer Motion** | Page transitions, card hovers, modal entrances |
| Mock data | Static `.ts` files in `/lib/mock` | No DB needed |
| Deployment | **Vercel** | One-command deploy for live demo URL |

---

## 7. Baseline File Structure

```
public-comment-amplifier/
├── app/
│   ├── layout.tsx                 # Root layout, fonts, providers
│   ├── page.tsx                   # Landing → redirects to onboarding or feed
│   ├── globals.css                # Tailwind + CSS variables
│   ├── api/
│   │   └── regulations/
│   │       └── route.ts           # Server route → calls regulations.gov, hides API key
│   ├── onboarding/
│   │   └── page.tsx               # Multi-step onboarding form
│   ├── feed/
│   │   └── page.tsx               # Home feed
│   └── regulation/
│       └── [id]/
│           └── page.tsx           # Regulation detail + comment composer
│
├── components/
│   ├── ui/                        # shadcn primitives (button, card, badge, dialog…)
│   ├── onboarding/
│   │   ├── DemographicsStep.tsx
│   │   ├── InterestsStep.tsx
│   │   └── ProgressBar.tsx
│   ├── feed/
│   │   ├── RegulationCard.tsx
│   │   ├── FeedHeader.tsx
│   │   └── TrendingRail.tsx
│   ├── regulation/
│   │   ├── RegulationHeader.tsx
│   │   ├── ProvisionsList.tsx
│   │   ├── GeneratedComment.tsx
│   │   └── CopyButton.tsx
│   └── shared/
│       ├── Logo.tsx
│       └── AgencyBadge.tsx
│
├── lib/
│   ├── regulationsApi.ts          # fetch wrapper + query builder for regulations.gov
│   ├── mock/
│   │   ├── regulations.ts         # Fallback data if API call fails
│   │   └── commentTemplates.ts    # Per-regulation template strings
│   ├── profile.ts                 # localStorage read/write helpers
│   ├── ranking.ts                 # Keyword-overlap relevance scoring
│   └── types.ts                   # UserProfile, Regulation, Comment types
│
├── context/
│   └── ProfileContext.tsx         # Provides user profile across pages
│
├── public/
│   ├── logo.svg
│   └── agency-icons/              # HHS, DOL, HUD, EPA, etc.
│
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 8. Demo Script (Suggested 90 Seconds)

1. **0:00 – 0:15** — Open landing, click "Get started," walk through onboarding as a home health aide in Ohio, select Healthcare + Labor.
2. **0:15 – 0:35** — Land on feed. Scroll. Top card is a CMS Medicare telehealth rule with "96% match." Point out variety of agencies.
3. **0:35 – 1:00** — Click into the rule. Show plain-language summary on the left. On the right, a fully drafted 400-word public comment — already in the user's voice, citing their occupation and state.
4. **1:00 – 1:20** — Click "Copy comment." Click "Open on regulations.gov ↗" — the real federal page opens in a new tab. Gesture to it: *"Paste, submit, done."*
5. **1:20 – 1:30** — Closing line: *"Every comment is anchored to a real person. We're not generating astroturf — we're closing the access gap."*

---

## 9. Success Criteria for the Demo

- The judges believe it works end-to-end
- The aesthetic reads as serious civic infrastructure, not a side project
- The narrative — onboarding → feed → comment — flows without a single visible glitch
- One screen (likely the comment composer) produces a genuine "oh, that's clever" moment
