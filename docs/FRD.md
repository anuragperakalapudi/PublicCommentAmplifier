# OpenComment — Functional Requirements Document (FRD)

**Project Type:** Production product (post-hackathon)
**Version:** 1.0
**Last Updated:** April 25, 2026
**Supersedes:** Public Comment Amplifier FRD v0.1 (hackathon)

---

## 1. Product overview

OpenComment helps ordinary Americans find federal proposed rules that affect their lives and submit substantive public comments to the official record. The product closes a real democratic access gap: trade associations and lobbyists routinely participate in federal rulemaking; ordinary citizens almost never do, despite having the legal right and a meaningful potential impact.

The product is built on three commitments:

1. **Anti-astroturf by construction.** Every comment is anchored to a real, signed-in user's lived situation, drafted from facts they entered, and submitted by them through the user's own session on regulations.gov. The product never auto-submits and never generates identical text across users.
2. **Privacy as primary UX.** The personal context that makes matches good is exactly the context users are afraid to share. Layered consent, plain-English data controls, and one-click deletion are core product surfaces, not legal afterthoughts.
3. **Outputs that don't read as AI.** Every LLM surface ships with a tuned system prompt, a banned-phrase post-processor, and a quality gate. The product is unusable if its prose feels machine-written.

This FRD covers the full production product. Implementation is phased (see §11). The hackathon demo (separate, deprecated) covered Phase 1's UI shell; the requirements below are the production target, with explicit calls out where the hackathon already covers a requirement.

---

## 2. User journey

A returning user's typical flow:

1. Receives weekly digest email at 9am Sunday with 5 personalized rules
2. Taps the most relevant card, lands on a rule detail page
3. Reads a plain-English summary written for a 9th-grade reader
4. Reviews an LLM-drafted comment grounded in their profile and stories
5. Edits the comment in-place, optionally runs an AI check for fact errors
6. Clicks "Open on regulations.gov," pastes their comment, submits
7. Returns, marks it as commented; the rule joins their activity timeline
8. Six weeks later, gets an email when the agency posts the final rule, showing what changed relative to what they said

A new user's first session is steps 1-7 minus the email; they reach the feed via search engine or referral, sign up, onboard, see a personalized feed.

---

## 3. Functional requirements

### 3.1 Authentication & accounts

- Email magic-link sign-in (no passwords). Provider: Clerk or Supabase Auth.
- Email verification required before personalized feed unlocks.
- Account deletion: one-click + one-click confirmation, executes within 24 hours, deletes profiles, stories, saved/commented records, email preferences. Auth-provider account also deleted.
- Data export: one-click email of full JSON dump.
- Sessions persist across devices (logged-in state via auth provider's standard mechanism).
- The public landing page and a sample feed are accessible without auth; personalization, save, comment-tracking, and email features require sign-in.

### 3.2 Onboarding

Three required tiers, the second two optional and clearly labeled:

**Tier 1 — Required (90 seconds):**
- Age range, occupation (free text with autocomplete on common roles), state of residence, income bracket, household status
- Topic multi-select chips: Healthcare, Housing, Labor, Disability, Immigration, Environment, Education, Veterans, Small Business, Civil Rights, Tax & Finance, Public Safety, Consumer Protection (expanded from hackathon's 9)
- Skippable per-field; only state and at least one topic are strictly required

**Tier 2 — Optional (free-form context):**
- Free-text "Anything else about your life that matters for matching?" box, 500 char max
- Optional toggles: "I have a chronic illness," "I'm a caregiver," "My job depends on environmental rules," "I'm an immigrant or have immigrant family," "I'm a veteran," etc. (curated list)
- Multi-state interest: optional secondary states ("family in," "work in")
- Each tier-2 input shows an inline note: "Used only to rank your feed. Never shared. Stored on your account only."

**Tier 3 — Optional story bank:**
- Up to 5 short stories (200 words each), tagged with topic
- Examples shown ("My experience with surprise medical bills," "Why my small business closed during the rule change")
- Stories are used as grounding context when drafting comments on related rules
- Each story can be edited or deleted at any time from settings

**Privacy panel:** persistent on every onboarding screen with plain-English statements about data use, no-sale commitment, no-auto-submit commitment, and a link to delete data.

**Progress and persistence:** progress bar across tiers; partial completion persists; users can return and add more later from settings.

### 3.3 Feed (home)

- Sticky top nav: logo, working search bar, profile menu
- Vertical card list, real regulations.gov data
- Each card shows:
  - Agency badge
  - Title
  - One-line LLM-generated plain-language summary (cached per document)
  - Closing date ("closes in 9 days" with urgency color when ≤7 days)
  - Match score with one-line reason ("matches your Healthcare interest and Ohio location")
  - Topic chips
  - Status pill: open / saved / commented
  - Save button (toggles `saved_regulations` in DB)
- Filter rail (collapsible on mobile):
  - Agency multi-select
  - Topic multi-select
  - Deadline urgency (this week / this month / any)
  - Match score slider (e.g., 80%+)
  - State relevance toggle
  - Status filters (open / saved / commented quick toggles)
- Sort options: best match (default), closing soonest, newest posted
- Search bar: hits `/v4/documents?filter[searchTerm]=` with active filters preserved, debounced 300ms
- Loading state: skeleton cards
- Empty states differentiated:
  - "No rules match your filters" (with reset filters action)
  - "Couldn't reach regulations.gov" (with retry)
  - "No rules currently open in your topics" (suggests broadening topics)
- No fake fallback data ever

### 3.4 Regulation detail

- Header: agency badge, title, deadline countdown, save button, mark-as-commented button, prominent "Open on regulations.gov ↗"
- Two-column layout (single column on mobile):
  - **Left:** plain-language summary (3 paragraphs, LLM-generated, cached), key provisions list (LLM-extracted from full rule, cached), official excerpt
  - **Right:** generated comment composer (see §3.5)
- "Why this is in your feed" panel with specific, cited reasons drawn from the user's profile and the rule's text (LLM-generated, cached per user-document pair)
- Related: "Other rules in this docket" section listing siblings via `/v4/dockets/{id}`

### 3.5 Comment composer

- LLM-drafted comment (300-450 words), generated on first detail-page load, cached for that user-document pair
- Three structurally different variants (not just tonal):
  - "Lead with my story" (personal experience first)
  - "Lead with the policy concern"
  - "Ask the agency a question"
- Variant selector regenerates from cache or makes a fresh call
- Editable inline (textarea, monospace document aesthetic)
- Word count below
- "Check my comment" button (Phase 4): runs Gemini fact-check pass; returns inline annotations for possibly inaccurate claims, weak sections, and grammar; user accepts or dismisses each
- Copy button: animates to "Copied ✓"
- Help text: "Copy this comment, then paste it into the official comment box on regulations.gov."
- Mark-as-commented button below the copy button; on click, prompts user to optionally paste back the final text they actually submitted

### 3.6 Save & activity tracking

- "Save" button on cards and detail pages writes to `saved_regulations`
- "/saved" page lists all saved rules sorted by deadline
- "Mark as commented" writes to `commented_regulations` with optional final-text field
- "/activity" page is a reverse-chronological timeline:
  - Comments submitted (with rule, agency, date, optional final text)
  - Final-rule events on dockets the user engaged with
  - Saved-then-closed rules (reminders that you saved but didn't comment on)
- Both lists exportable as CSV

### 3.7 Email & notifications

- Email preferences page with:
  - Digest frequency: daily / weekly / off (default: weekly)
  - Digest delivery time and timezone (default: Sunday 9am user-local)
  - Closing-soon alerts: on/off (default on, saved rules only)
  - Final-rule alerts: on/off (default on, for engaged dockets)
  - Quiet hours
  - Topic-level mute (don't email me about Immigration rules)
- Hard cap: never more than 3 emails in any 7-day window unless user opted into daily digest
- All email lists support one-click unsubscribe (RFC 8058)
- Plain-text alternative always included
- Sender domain authenticated (SPF, DKIM, DMARC)

**Digest email:**
- 5 rules max per email; if fewer than 3 good matches, skip that period entirely
- For each: title, agency, deadline, one-line summary, match reason, CTA
- Subject line specifies content ("5 health rules close this month, including Medicare home visits")

**Closing-soon email:**
- Triggered when a saved rule (or rule above match threshold the user hasn't dismissed) is 7, 3, or 1 days from closing
- Maximum once per rule per threshold

**Final-rule email:**
- Triggered nightly when a docket the user saved or commented on gets a new document of `documentType=Rule`
- Email shows: original rule, what changed, agency's response section excerpt, link to final rule
- Does NOT classify the change as good/bad

### 3.8 Settings

- Profile editor (all fields from onboarding tiers 1-3)
- Email preferences
- Privacy controls:
  - "What we know about you" — full data summary, plain English
  - Per-field delete buttons
  - Export all data
  - Delete account
- Theme (light/dark, deferred to post-launch)
- Connected to: nothing. We don't integrate third-party identity beyond auth.

### 3.9 regulations.gov API integration

**Endpoints:**

| Endpoint | Use | Phase |
|---|---|---|
| `GET /v4/documents` | Feed data, with `filter[documentType]=Proposed Rule`, `filter[commentEndDate][ge]=<today>`, `sort=-postedDate`, `page[size]=250` | 1 |
| `GET /v4/documents/{id}` | Detail page full data | 1 |
| `GET /v4/dockets/{id}` | Sibling docs, RIN, final-rule detection | 2 |
| `GET /v4/comments?filter[commentOnId]=` | "Comments like yours" | 4 |
| `POST /v4/comments` | Direct submission (separate registered key required) | 4, behind feature flag |

**Caching:**
- Server-side Redis (Upstash), 5-min TTL on document list, 1-hour TTL on detail
- Nightly job at 4am ET snapshots all currently-open Proposed Rules into our DB; per-user calls hit our DB first, fall through to API only on miss
- Per-document LLM-generated content (summary, key provisions) cached forever per document version

**Auth & limits:**
- Real registered API key in env (no `DEMO_KEY` in production code)
- Watch rate-limit headers; circuit-break to cached snapshot if approaching 1,000/hour cap
- Commenting key (Phase 4) is separately registered with real-name attestation

### 3.10 Ranking

**Phase 1:**
- Keyword overlap (current implementation, refined)
- Agency-to-topic mapping (current, expand to 100+ agencies from current ~15)
- Recency boost (newer rules ranked higher within same match band)
- Urgency boost (rules closing within 7 days get bumped)
- State match: explicit boost only when rule text mentions user's state(s); never down-rank national rules

**Phase 3:**
- Add semantic similarity via Gemini embeddings stored in pgvector
- Add user-feedback signal (thumbs up/down on cards trains a per-user weight)
- Add story-match: when a user's story tags overlap with rule topics, boost
- Final score is weighted sum, weights tunable

**Match score in UI:** displayed as percentage; the underlying score normalized to 0-100. Treat as a relative ranking signal, not an objective metric — never claim "96% match" without it actually meaning something.

### 3.11 LLM surfaces

All LLM calls go through `lib/llm.ts`. Every surface has a tuned system prompt and post-processor.

**Mandatory post-processor rules (applied to every LLM output):**
- Strip em dashes; replace with periods, commas, or "and"
- Flag and regenerate (up to 2 retries) if any of these appear: "delve," "tapestry," "ever-evolving," "navigating the complexities," "unprecedented," "leverage" (as verb), "foster" (as transitive verb meaning encourage), "robust" (as synonym for good), "comprehensive" (as filler)
- Flag and regenerate if response opens with "I'd like to," "I want to share," "It's important to note," "In today's world"
- Flag if any sentence exceeds 35 words

**Quality gate:** Gemini Flash post-pass that checks for (a) banned phrases, (b) factual claims not grounded in user profile or rule text, (c) any made-up specifics. Failures regenerate up to twice; persistent failures show with a flag to the user.

**Surfaces:**

| Surface | Model | Cached |
|---|---|---|
| One-line feed summary | Gemini Flash | Per-document, forever |
| Detail page summary (3 paragraphs) | Gemini Pro | Per-document, forever |
| Key provisions list | Gemini Pro | Per-document, forever |
| "Why this is in your feed" | Gemini Flash | Per (user, document), 30-day TTL |
| Comment draft | Gemini Pro | Per (user, document, variant), 30-day TTL |
| Comment edit-check (Phase 4) | Gemini Pro | Not cached |
| Adaptive interview (Phase 3) | Gemini Flash | Conversation in session memory only |

**Prompt engineering:** every prompt is version-controlled, every output is logged with prompt version + model version + temperature for review. Bad outputs are collected and used to refine prompts.

### 3.12 The "no auto-submit" guarantee

- The product never POSTs a comment to regulations.gov on the user's behalf in Phases 1-3
- Phase 4 may add direct submission only with: explicit per-comment user confirmation modal, full audit log per submission, and a server-side kill switch
- Marketing copy and onboarding both make this explicit: "We never submit on your behalf without you clicking submit."

---

## 4. Non-functional requirements

### 4.1 Performance

- Time to first byte on landing: < 500ms
- Feed first paint with skeleton: < 1s
- Feed full render: < 2.5s on a typical broadband connection
- LLM-generated comment first byte: < 5s (streamed); full comment: < 15s
- Cached LLM content: < 200ms
- Mobile Lighthouse score: ≥ 90 on Performance, Accessibility, Best Practices

### 4.2 Accessibility

- WCAG 2.1 AA conformance
- All interactive elements keyboard-navigable
- All images have meaningful alt text
- Color is never the sole carrier of information
- Focus states visible
- Tested with VoiceOver and NVDA at minimum
- Comment composer textarea is screen-reader-friendly with clear instructions

### 4.3 Mobile

- Responsive from 320px up
- Touch targets ≥ 44px
- Filter rail collapses to bottom-sheet on mobile
- Two-column detail page collapses to single column with right-column priority
- Mobile-tested before each release (the hackathon explicitly skipped this; it's required now)

### 4.4 Browser support

- Last 2 versions of Chrome, Firefox, Safari, Edge
- iOS Safari 15+
- Android Chrome 100+

### 4.5 Reliability

- 99.5% uptime target (Vercel + Supabase + Upstash all give us this floor)
- Graceful degradation: if Gemini is down, show cached summaries and a notice; if regulations.gov is down, show our DB snapshot with a clear "showing yesterday's data" banner
- All emails idempotent: a retried cron job never sends duplicates

### 4.6 Privacy & security

- All data encrypted at rest (Supabase default) and in transit (TLS)
- API keys server-side only (already done in hackathon, verify)
- LLM provider data policy reviewed: no training on our prompts/outputs
- No third-party analytics that profile users (PostHog self-hosted or privacy-mode)
- Cookies: only essentials. Banner only if/when we add anything beyond auth.
- Privacy policy and terms of service drafted by counsel before public launch
- DSAR (data subject access request) handling: export and delete are self-serve
- Breach notification process documented internally

### 4.7 Observability

- Sentry for errors, with PII scrubbing
- Server logs include request ID for tracing across services
- LLM prompt/output logging with PII redaction for prompt-quality review
- Email send logs (Resend webhooks)
- Cost dashboards: weekly LLM spend, monthly DB and email spend

---

## 5. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 App Router | Carryover from hackathon. Server actions and route handlers fit our needs. |
| Language | TypeScript (strict) | Carryover. |
| Auth | Clerk | Magic-link out of the box, low friction. Supabase Auth acceptable alternative. |
| Database | Supabase Postgres + pgvector | Cheap, generous free tier, built-in row-level security, vector support without a second service. |
| Cache | Upstash Redis | Replaces in-memory cache (which doesn't survive Vercel cold starts). Free tier covers us. |
| LLM | Gemini 2.5 Pro (drafting) + 2.5 Flash (summaries) | Good price/performance, generous free tier for low volume, prompt caching support. |
| Embeddings | Gemini text-embedding-004 | Same provider, single billing. |
| Email | Resend + React Email | Modern, developer-friendly, RFC 8058 unsubscribe support. |
| Cron | Vercel Cron | Already on Vercel. Fine for nightly snapshots, digest sends, final-rule polling. |
| Styling | Tailwind + CSS variables | Carryover. |
| Animation | Framer Motion | Carryover. |
| Icons | Lucide React | Carryover. |
| Fonts | Fraunces (display) + Inter Tight (body) via `next/font` | Carryover. |
| Analytics | PostHog (cloud or self-hosted) | Privacy-first. |
| Errors | Sentry | Standard. |
| Hosting | Vercel | Carryover. |
| Domain | TBD (recommend `opencomment.us` or `.org`) | The `.org` framing matches civic-tool positioning. |

---

## 6. File structure (Phase 1 endpoint)

```
opencomment/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                  # Landing
│   │   ├── about/page.tsx
│   │   └── privacy/page.tsx          # Long-form privacy policy
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (app)/
│   │   ├── onboarding/page.tsx       # Tiered onboarding
│   │   ├── feed/page.tsx
│   │   ├── regulation/[id]/page.tsx
│   │   ├── saved/page.tsx
│   │   ├── activity/page.tsx
│   │   ├── settings/
│   │   │   ├── profile/page.tsx
│   │   │   ├── stories/page.tsx
│   │   │   ├── email/page.tsx
│   │   │   └── privacy/page.tsx      # User-facing data controls
│   │   └── layout.tsx                # Auth-required wrapper
│   ├── api/
│   │   ├── regulations/route.ts      # Existing proxy, expanded
│   │   ├── llm/
│   │   │   ├── summary/route.ts
│   │   │   ├── comment/route.ts
│   │   │   ├── why/route.ts
│   │   │   └── check/route.ts        # Phase 4 edit-check
│   │   ├── activity/route.ts
│   │   └── webhooks/
│   │       ├── clerk/route.ts        # User created → make profile row
│   │       └── resend/route.ts       # Bounce/spam handling
│   ├── cron/
│   │   ├── snapshot/route.ts         # Nightly regulations.gov pull
│   │   ├── digest/route.ts           # Daily/weekly digest sender
│   │   ├── closing-soon/route.ts
│   │   └── final-rule/route.ts       # Phase 2
│   └── layout.tsx
│
├── components/
│   ├── onboarding/
│   ├── feed/
│   ├── regulation/
│   ├── settings/
│   ├── shared/
│   └── ui/                           # Primitives
│
├── lib/
│   ├── llm/
│   │   ├── client.ts                 # Gemini wrapper
│   │   ├── prompts/                  # Versioned prompt files
│   │   │   ├── summary.ts
│   │   │   ├── comment.ts
│   │   │   ├── why.ts
│   │   │   └── check.ts
│   │   └── postprocess.ts            # Em-dash strip, banned phrases, gate
│   ├── ranking/
│   │   ├── keyword.ts
│   │   ├── agency.ts
│   │   ├── embeddings.ts             # Phase 3
│   │   └── score.ts                  # Combined scorer
│   ├── regulationsApi.ts             # Refactor of hackathon version
│   ├── db/
│   │   ├── schema.ts                 # Drizzle or Prisma schema
│   │   ├── profiles.ts
│   │   ├── saved.ts
│   │   ├── commented.ts
│   │   └── stories.ts
│   ├── email/
│   │   └── templates/                # React Email components
│   ├── cache.ts                      # Upstash wrapper
│   ├── types.ts
│   └── auth.ts                       # Clerk helpers
│
├── emails/
│   ├── digest.tsx
│   ├── closing-soon.tsx
│   └── final-rule.tsx
│
├── public/
│   ├── logo.svg
│   └── og/                           # Social share images
│
├── tests/
│   ├── llm/                          # Snapshot tests for prompt outputs
│   ├── ranking/                      # Unit tests for scoring
│   └── e2e/                          # Playwright happy path
│
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── PRIVACY_NOTES.md              # Internal: what we collect and why
│   └── PROMPT_NOTES.md               # Internal: prompt versioning history
│
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

Files removed from hackathon: `lib/mock/regulations.ts`, `lib/mock/commentTemplates.ts`. The `mock/` directory is deleted entirely.

---

## 7. Out of scope (explicitly)

- Mobile app (web-first; PWA possibly later)
- State and local rulemaking (federal only for now; the data sources are completely different)
- Comment-volume tools for advocacy organizations (this is consumer, not B2B; if an org wants to use us, they use it as individuals)
- Comment translation across languages (Phase 5+; English-only at launch)
- AI-assisted classification of final-rule changes as good/bad for the user (deliberate non-goal — see PROJECT_PLAN.md §9.3 and §12)
- Web-search-based onboarding that looks up the user externally (deliberate non-goal — see PROJECT_PLAN.md §8.3 and §12)
- Auto-submission of comments without explicit user click (permanent non-goal across all phases)

---

## 8. Success metrics

**Phase 1 launch:**
- 100 signed-up users
- 30%+ of signups complete onboarding through tier 1
- 10%+ of signups submit at least one comment (verified via "mark as commented")
- Average LLM-comment quality score (manual review of 50 random outputs) ≥ 4/5
- 0 reported AI-tells in launched output (em dashes, banned phrases) per 100 outputs

**Phase 2 (3 months post-launch):**
- 1,000 signed-up users
- 40%+ weekly digest open rate
- 15%+ weekly digest click-through to a rule
- 25%+ of users have submitted at least one comment

**Phase 3 (6 months):**
- Match satisfaction signal (thumbs up/down) ≥ 70% positive

**Phase 4 (9-12 months):**
- 5,000+ users
- 1,000+ verified comments submitted via the platform
- At least one final-rule citation we can plausibly link to a comment shaped on OpenComment

The qualitative bar matters more than the quantitative one: agency staff who read OpenComment-assisted comments should not be able to tell they came from a tool. If they can, we've failed regardless of user count.

---

## 9. Risks

(Detailed in PROJECT_PLAN.md §13. Summary here for FRD reference.)

| Risk | Severity | Mitigation summary |
|---|---|---|
| AI-spammy comments → astroturf perception | Critical | §3.11 discipline; manual quality gate at launch |
| LLM costs spiral | Medium | Aggressive caching; per-document not per-user |
| regulations.gov rate limits | Medium | Nightly DB snapshot |
| User uploads sensitive PII to story bank | Medium | Encryption, no model-training, easy delete |
| Final-rule detection misfires | Low | Conservative trigger; manual review of first 50 |
| Bad-faith mass usage by orgs | Medium | Email verification; rate limits; manual review |
| Privacy/legal exposure | High | Counsel review before launch |
| Direct-submission API misuse (Phase 4) | High | Feature-flagged; per-submission audit log; kill switch |

---

## 10. Open decisions

To resolve before each phase begins:

| Decision | Phase | Lean |
|---|---|---|
| Auth provider | 1 | Clerk |
| Public-feed-without-auth | 1 | Yes (feed public, personalization gated) |
| Domain name | 1 | `opencomment.org` |
| Email digest defaults | 2 | Sunday 9am local, 5 rules |
| Embedding provider | 3 | Gemini text-embedding-004 |
| Direct submission shipping | 4 | Defer until Phase 1-3 telemetry suggests value > risk |

---

## 11. Phase mapping (cross-reference)

This FRD describes the production product. Implementation phasing lives in `PROJECT_PLAN.md` §2 and §15. Summary:

- **Phase 1:** Auth, DB, real LLM, save/commented, filters, search, deploy
- **Phase 2:** Email digest, closing-soon, final-rule detection
- **Phase 3:** Free-text + stories + embeddings + multi-state + better ranking
- **Phase 4:** Edit-assist, direct submission, comments-like-yours

Phase 1 alone constitutes a launchable, defensible product. Each subsequent phase adds depth, not breadth.

---

## 12. Demo / launch script (60 seconds, post-Phase 1)

A pitch for the production launch:

1. **0:00 – 0:10** — Land on opencomment.org. "Federal agencies write 3,000+ rules a year. Most affect people who never know they exist. OpenComment fixes that."
2. **0:10 – 0:25** — Sign up with email magic link. Onboard in 90 seconds. "Tell us about your life. We don't sell it. We don't share it. You can delete it any time."
3. **0:25 – 0:40** — Land on personalized feed. Real federal rules. "These are open right now. This one closes in 9 days. This one is from your state's Medicaid program."
4. **0:40 – 0:55** — Click into a rule. Read the plain-English summary, scan the AI-drafted comment that already references your job and where you live. Edit two sentences.
5. **0:55 – 1:00** — Click out to regulations.gov. Paste. Submit. Closing line: "Your voice is on the federal record. We'll email you when the final rule posts."

---

*This FRD supersedes the v0.1 hackathon document. Changes vs v0.1: scope expanded from demo to production; comment generation moved from templates to LLM with strict anti-AI-tell discipline; auth, DB, email, lifecycle tracking, and embeddings added; mock fallback removed; privacy framing promoted from §4 detail to first-class commitment in §1.*
