# OpenComment — Production Project Plan

> Moving from a hackathon demo to a real product that ordinary Americans actually use to participate in federal rulemaking.

---

## 0. North star

OpenComment exists because lobbyists and trade associations show up to federal rulemaking and ordinary Americans don't. Closing that gap means meeting people in their actual life — what they do, where they live, who they care for — and helping them put a substantive comment on the official record in under three minutes.

Three commitments shape every product decision below:

1. **Anti-astroturf by construction.** The Administrative Conference of the United States and recent NY AG reporting have flagged AI-generated comment floods as a real problem agencies are wrestling with. We are *not* a comment-volume tool. Every OpenComment-assisted submission is anchored to a real person's lived situation, drafted from facts they entered, edited by them, and submitted manually through regulations.gov. We never auto-submit. We never generate identical text. We never pretend a fact the user didn't tell us.
2. **Privacy as positioning, not afterthought.** The personal context that makes our matches good (occupation, household, conditions, immigration status, finances) is exactly the data that makes people uncomfortable. We treat that as the central UX problem, not a checkbox.
3. **The output must not feel AI-spammy.** This is the single biggest brand risk. People can smell em-dash-laden, vacant LLM prose from a mile away, and the moment they smell it the project loses credibility — both with users and with the agency staff who read these comments. Every LLM surface needs a hand-tuned system prompt, post-processing, and quality bars. Specifics in §7.

---

## 1. What we're keeping vs. rebuilding

The hackathon left us with a strong UI/UX foundation. The aesthetic, the three-screen narrative, the onboarding flow shape, and the regulations.gov integration pattern are all keepers. The things that need to be replaced or built:

| Area | Status | Action |
|---|---|---|
| Visual design system | Solid | Keep. Minor polish only. |
| Onboarding (3 steps) | Solid shell | Extend with optional "tell me more" step + privacy framing |
| Feed | Solid | Add filters, search, save/comment status, better summaries |
| Regulation detail | Solid shell | Replace template comments with real LLM, add edit + AI-review |
| Comment templates (`lib/mock/commentTemplates.ts`) | Throwaway | Delete after LLM replaces it |
| Auth | None | Build (Clerk or Supabase Auth) |
| Database | None (`localStorage`) | Build (Postgres on Supabase) |
| Email | None | Build (Resend + cron) |
| LLM layer | None | Build (Gemini, with rigorous prompting) |
| Ranking algo | Keyword overlap | Hybrid: keyword + agency map + embeddings + user signals |
| Rule lifecycle tracking | None | Build (poll dockets, detect Final Rules) |
| Mock fallback | Dead code | Delete — `lib/mock/regulations.ts` goes |

---

## 2. Phasing

I'd ship this in four phases, each one independently launchable. The temptation will be to do everything at once — resist it. Phase 1 alone, done well, is a meaningful product.

### Phase 1 — Foundation (the real product)
**Goal:** A logged-in, persistent, LLM-powered version of what we have, deployed publicly.

- Auth (email magic-link via Clerk, or Supabase Auth)
- Postgres database (Supabase) replacing `localStorage` for profiles
- Gemini-powered comment generation (replacing `commentTemplates.ts`)
- Gemini-powered plain-language regulation summaries (replacing `docAbstract` truncation)
- Save / un-save regulations (the button currently does nothing)
- "I commented on this" status with a "My Activity" page
- Better one-line feed summaries (LLM-generated, cached)
- Search bar in feed wired up
- Feed filters: agency, topic, deadline urgency, match score, state
- Vercel deploy + custom domain
- Privacy policy, terms, and a clear "what we do and don't do with your data" page

### Phase 2 — Notifications & lifecycle
**Goal:** Bring users back. Close the loop on what happened to the rules they cared about.

- Email digest (daily or weekly, user-configurable, with delivery time)
- Closing-soon reminders (rules above match threshold or in saved list, 7/3/1 days before close)
- Final-rule detection: nightly poll of dockets the user has saved or commented on; when a `documentType=Rule` appears in a docket where they engaged, send a "what happened" email
- In-app activity timeline ("You commented on X. The rule was finalized on Y. Here's what changed.")
- Email preferences page (frequency, quiet hours, timezone, topic-level mute)

### Phase 3 — Personalization depth
**Goal:** Match accuracy good enough that users trust the feed.

- Optional free-text "anything else?" box on onboarding
- Optional adaptive interview ("a few quick questions" — LLM asks 3-5 follow-ups based on what's already known, never web-searches the user)
- Story bank: optional space for users to write 2-4 short personal stories the LLM can draw on when drafting comments
- Embedding-based semantic match alongside keyword + agency mapping
- Multi-state interest (live in Maryland, family in West Virginia, work in DC)
- "Why this is in your feed" — replace the current generic explanation with specific, cited reasons ("You selected Healthcare. This rule changes Medicare reimbursement for home health visits, which you mentioned doing in Ohio.")
- User feedback signal on ranking ("More like this" / "Less like this" thumbs)

### Phase 4 — Voice & impact
**Goal:** Make commenting feel like it mattered.

- AI-assisted editing: user edits the comment, LLM gently flags weak claims, factual errors, or places where their own story would strengthen it. Never auto-rewrites.
- Direct submission via the regulations.gov commenting API (requires a separate registered key — see §5)
- "Comments like yours" preview pulled from the docket's existing comments via `/v4/comments`
- Impact reports: when a final rule cites public comments by theme, show users where their themes appeared
- Optional opt-in: anonymized comment data contributed to public-interest research datasets (with full transparency)

---

## 3. Architecture changes

```
Phase 1+ stack:

Frontend          Next.js 14 App Router (unchanged)
Auth              Clerk OR Supabase Auth (recommend Clerk for speed)
Database          Supabase Postgres
                  Tables: users, profiles, saved_regulations,
                          commented_regulations, stories,
                          email_preferences, ranking_feedback,
                          docket_watch
LLM               Gemini 2.5 Pro (drafting) + 2.5 Flash (summaries, ranking helpers)
                  Routed through a single server-side `lib/llm.ts` wrapper
Email             Resend + React Email templates
Cron              Vercel Cron (digests, closing-soon, final-rule polling)
Cache             Upstash Redis (regulations.gov responses, summaries, drafts)
                  Replaces the current in-memory map (which doesn't survive
                  cold starts on Vercel anyway)
Embeddings        Gemini text-embedding-004, stored in Postgres pgvector
Analytics         PostHog (privacy-first, self-hostable)
Error tracking    Sentry
```

Why this stack: every piece is free or near-free at our scale, all of it deploys in one click, none of it locks us in. Clerk + Supabase + Vercel + Resend is a well-trodden path; we're not inventing anything.

---

## 4. Database schema (Phase 1)

```
users                 -- managed by Clerk/Supabase Auth
  id, email, created_at

profiles
  user_id (pk, fk users)
  age_range, occupation, state, income_bracket, household
  topics text[]                       -- ['healthcare', 'labor']
  free_text_context text               -- Phase 3 ("anything else?")
  additional_states text[]             -- Phase 3 (multi-state)
  privacy_level enum                   -- 'minimal' | 'standard' | 'detailed'
  updated_at

stories                                -- Phase 3
  id, user_id, title, body, tags text[], created_at

saved_regulations
  user_id, document_id, saved_at
  pk (user_id, document_id)

commented_regulations
  user_id, document_id, marked_at,
  comment_text text,                   -- what they actually submitted (optional)
  source enum ('manual_paste', 'api_submitted')

email_preferences
  user_id (pk)
  digest_frequency enum ('daily', 'weekly', 'off')
  digest_time time, timezone text
  closing_soon_alerts bool
  final_rule_alerts bool

ranking_feedback                       -- Phase 3
  user_id, document_id, signal enum ('more_like', 'less_like'),
  created_at

docket_watch                           -- Phase 2
  user_id, docket_id, last_seen_documents text[]
  -- Used for final-rule detection

regulation_cache                       -- summary + key provisions, LLM-generated
  document_id (pk)
  short_summary text                   -- 1 sentence for feed
  long_summary text                    -- 2-3 paragraphs for detail page
  key_provisions text[]                -- bulleted list
  generated_at, model_version
```

The cache table matters. LLM calls are slow and cost real money. Summaries don't change once a rule is posted, so we generate once per document and reuse forever.

---

## 5. regulations.gov API — what we're using

The hackathon only uses `/v4/documents`. The API surface we should leverage:

| Endpoint | Use |
|---|---|
| `GET /v4/documents` | Existing feed source. Keep `page[size]=250`. |
| `GET /v4/documents/{id}` | Detail page — pulls full `docAbstract`, attachments, related docs |
| `GET /v4/dockets/{id}` | RIN, docket title, all docs in the docket — used for final-rule detection |
| `GET /v4/comments?filter[commentOnId]={objectId}` | "Comments like yours" — sample existing comments to show users what others are saying. Phase 4. |
| `POST /v4/comments` | Direct submission. **Requires separate registered key** with the user's name and intended use; rate-limited 50/min, 500/hr. Phase 4 only, behind a feature flag. |

A few correctness fixes worth making during Phase 1:

- The current code drops `searchTerm` because v4 does whole-word matching. Correct call. We should additionally consider `filter[agencyId]=` filtering (multi-value, comma-separated) when the user's selected topics map cleanly to a small agency set — that's much more API-efficient than fetching 250 and re-ranking.
- Add `filter[commentEndDate][ge]=<today>` server-side as a hard filter (we currently fetch them and filter client-side).
- Cache key should include the topic set, not just "all open proposed rules" — when we add agency filtering, the URL varies.
- The 1,000 GET requests/hour limit is generous, but a popular launch could blow through it. Cache aggressively (the data changes on a daily cadence, not a per-minute one) and consider batched nightly snapshots into our DB rather than per-user live calls.

Two FAQ-level constraints from the docs worth flagging now:
- The commenting API key is *separate* from the GET key, requires a real-name registration, and has tighter limits. Don't promise direct submission until that key is in hand.
- `DEMO_KEY` should disappear from the codebase entirely once we have a real key. Right now `README.md` still mentions it as a fallback.

---

## 6. Personalization & ranking

The current ranking is keyword overlap + a hand-curated agency-to-topic map. That's fine for nine topic chips. It breaks the moment we add free-text interests, stories, and multi-state.

**Phase 1 (no embeddings yet):**
Keep what we have. Add three signals:
- Recency boost (already partially there — formalize it)
- Closing-soon urgency boost (more weight as deadline approaches)
- User feedback (down-rank docs they've dismissed, up-rank by agency/topic if they thumbed-up similar ones)

**Phase 3 (embeddings):**
For each document we've seen, generate a Gemini embedding of `title + abstract + key provisions`. Store in pgvector. For each user, generate a profile embedding from their topics + free text + stories. Cosine similarity becomes one of several scoring inputs (alongside keyword overlap, agency match, recency, urgency, feedback). Weights tuned by hand initially, by user-feedback signal eventually.

**RAG?** The user asked. Honest answer: not for ranking. RAG is a retrieval architecture; what we want here is a retrieval *scoring* function, which is just embeddings. Where RAG actually helps is comment drafting and "explain this rule": when generating a comment about a 200-page proposed rule, we should embed the rule's chunks and retrieve the 5-10 most relevant ones to ground the LLM. That's the right place for RAG.

**State logic.** Right now state appears to influence ranking weakly. We should:
- Many federal rules apply nationally. State should NOT down-rank them.
- Some rules have explicit state impact (Medicaid waivers, EPA state implementation plans). When the rule's text mentions the user's state, give a strong boost.
- Phase 3: support `additional_states` (family in another state, work crossing borders).

---

## 7. The LLM problem — making it not feel like AI

This is the most important section of this plan. The user's instinct is right: the moment our output reads like AI sludge, the project is dead. Here is the discipline that prevents that.

### 7.1 Surfaces and where LLM goes

| Surface | LLM use? | Why |
|---|---|---|
| Feed one-line summary | Yes (Gemini Flash, cached forever per doc) | The truncated `docAbstract` is often unreadable bureaucratese. |
| Detail page plain-language summary | Yes (Gemini Pro, cached forever per doc) | Same reason, longer form. |
| Key provisions list | Yes (Gemini Pro, cached forever per doc) | Pulled from full rule text via RAG |
| "Why this is in your feed" | Yes (Gemini Flash, generated on-demand, cached per (user, doc) pair) | Needs both the rule and the user's profile |
| Comment draft | Yes (Gemini Pro, generated on-demand) | The core feature |
| Comment edit assistant | Yes (Gemini Pro, on user trigger) | Phase 4 |
| Adaptive onboarding interview | Yes (Gemini Flash, conversational) | Phase 3 |
| Email digest copy | Hand-written templates with LLM-personalized hooks | Mostly templated |

### 7.2 The "no em-dash, no AI-spammy" discipline

Anti-AI-tells, applied as system prompt rules and post-processing:

1. **Banned punctuation/words list, applied via post-processing regex:**
   - Em dashes (`—`) — replace with periods, commas, or "and"
   - "It's important to note that..."
   - "In today's world..."
   - "Delve into," "tapestry," "navigating the complexities," "unprecedented," "leverage" (when used as a verb), "foster," "robust" (when meaning "good"), "comprehensive" (filler), "ever-evolving"
   - "I'd like to" / "I want to share" boilerplate openings
   - Any sentence starting with "Furthermore," "Moreover," "Additionally,"
2. **Voice rules in the system prompt:**
   - Write at a 9th-grade reading level
   - Vary sentence length aggressively (mix 4-word and 25-word sentences)
   - Use specific nouns, not abstract ones ("the $40 copay" not "the financial burden")
   - One concrete fact per paragraph minimum
   - No throat-clearing openers
   - First-person voice anchored to the user's actual occupation, location, household
3. **Forbidden moves:**
   - Don't invent facts. Only use what's in the user's profile, stories, and the rule itself.
   - Don't cite statistics that aren't in the rule.
   - Don't claim the user has experiences they didn't tell us about.
   - If the user has thin context, write a thinner comment. Don't pad.
4. **Quality gate before showing to user:**
   - Run a lightweight Gemini Flash check that flags: (a) any banned words/phrases that slipped through, (b) any factual claim not grounded in the user profile or rule text, (c) any sentence over 35 words. Regenerate if it fails twice; show with a flag if it fails three times.
5. **Three variants, but actually different:**
   - The current "Balanced / Shorter / More personal" tonal shift is fine but the variants are too similar. They should differ structurally (lead with personal story vs. lead with policy concern vs. lead with question to the agency), not just in word count.

### 7.3 System prompts (sketches — to be tuned in implementation)

These are starting points. They'll need real iteration with real outputs.

**Plain-language regulation summary (detail page):**
```
You are explaining a federal proposed rule to someone who has not read it
and may never have read one before. They have a high school education
and a busy life.

Output exactly three paragraphs:
1. What the rule does, in concrete terms. Open with the change. No throat-clearing.
2. Who is affected and how. Use specific job titles, household types,
   dollar amounts where the rule names them.
3. What's at stake in the comment period. What is the agency asking
   the public about? When does the period close?

Rules:
- 9th grade reading level. Short sentences mixed with longer ones.
- No em dashes. No "delve," "tapestry," "navigate complexities,"
  "comprehensive," "robust," "ever-evolving," "unprecedented."
- No "It's important to note." No "In today's world."
- Use the rule's own dollar figures, dates, and program names. Quote them
  exactly when they appear.
- If the rule is technical and you cannot fairly summarize it without
  losing fidelity, say so. Better to admit complexity than to oversimplify.

[Then: full rule text, RAG-retrieved chunks if long]
```

**Comment draft:**
```
You are helping a real American write a public comment on a federal
proposed rule. They will paste this comment into regulations.gov and
submit it under their name. Their identity and circumstances must be
accurate; never invent details.

Use only what is in the USER PROFILE, USER STORIES, and RULE EXCERPT
sections below. If a relevant piece of context is missing, write a
shorter, more general comment rather than fabricating.

Voice:
- First person, conversational, written the way an actual person talks.
- Specific over abstract. "I drive 45 minutes to the nearest urgent care"
  beats "rural healthcare access is challenging."
- Reference the rule by its actual name and the specific provision they're
  responding to.
- 300-450 words. If you cannot fill that space honestly, write 200 words.

Avoid:
- Em dashes. Replace with periods, commas, or "and."
- The phrases: "I'd like to," "I want to share," "It's important to note,"
  "In today's world," "Furthermore," "Moreover," "Additionally."
- The words: delve, tapestry, navigate (when figurative), comprehensive,
  robust, ever-evolving, unprecedented, leverage (as verb), foster.
- Stating support or opposition without a reason grounded in the user's
  life. Agencies discount comments that are pure position statements.

Structure (loosely — do not include section headers):
1. One sentence saying what rule they're commenting on and their stake in it.
2. Their relevant lived experience (2-3 sentences, specific).
3. How the proposed rule would affect them or people in their situation.
4. A concrete suggestion or question for the agency.

[USER PROFILE]
[USER STORIES — if any]
[RULE NAME, AGENCY, DOCUMENT ID]
[RULE EXCERPT — RAG-retrieved relevant chunks]
```

**"Why this is in your feed":**
```
You are explaining to a user why a particular regulation showed up high
in their personalized feed. Be specific and short. 2-3 sentences.

You have:
- The user's selected topics, occupation, state, household
- The rule's title, agency, and a one-line summary
- The match signals that fired (which keywords overlapped, which agencies
  matched, etc.)

Write as if speaking to the user. Cite the actual things they told us
("You selected Healthcare and you're a home health aide in Ohio") and
the actual feature of the rule ("This rule changes Medicare's
reimbursement for home health visits"). Do not be generic. Do not
say "based on your interests." Say what the interest is.

No em dashes. No filler.
```

### 7.4 Edit-assist (Phase 4)

The user edits the comment in a textarea. They click "Check my comment." The LLM does *not* rewrite. It returns inline annotations:
- **Possibly inaccurate:** "You said the rule cuts funding by 30%. The rule's text says 18%. [show the rule text]"
- **Worth strengthening:** "Your second paragraph is strong on personal experience but doesn't connect to a specific provision. Consider naming Section 3.2."
- **Spelling/grammar:** standard inline marks.
- **Tone check:** "This sentence reads more like a slogan than a comment. Agencies discount that. Want to soften?"

Never auto-apply. Always require user click to accept.

---

## 8. Onboarding — depth without creepiness

The user's instinct here is exactly right and worth taking seriously. The data we want is exactly the data people are scared to give. Three design moves resolve this:

### 8.1 Layered consent

Onboarding is split into clearly labeled tiers:

- **Tier 1: Required (the existing 3 steps).** Topics, broad demographics. ~90 seconds.
- **Tier 2: Optional — better matching.** Free-text "anything else about your life that matters?" box. State-of-mind toggles ("I have a chronic illness," "I care for an aging parent," "My job depends on environmental regulations"). Each tier-2 input shows next to it: "Used only to rank your feed. Never shown to anyone. Stored only on your account."
- **Tier 3: Optional — the story bank.** "Want to write a few short stories about your life? When we draft comments for you, we can ground them in your real experience instead of generic statements." Examples shown.

Each tier is skippable. The match quality clearly improves as the user opts in, and we tell them that — but we don't gate the product on it.

### 8.2 The privacy panel

Persistent on every onboarding screen, plain English:
- "Your answers stay on your account. We don't sell them, share them, or train models on them."
- "We will never auto-submit a comment for you. You always copy, review, and submit yourself."
- "You can delete your account and all your data with one click. [link]"
- Link to the actual privacy policy.

### 8.3 The adaptive interview (Phase 3, optional)

Skip for now. Then later, behind a clear opt-in: "Answer a few questions and we'll match better." The LLM asks 3-5 follow-ups based on what the user already said, one at a time, conversationally. Examples:

- (User said "home health aide" + "Ohio") → "Do you mostly work with seniors, people with disabilities, or both?"
- (User said "small business owner") → "Roughly how many employees? And in what industry?"
- (User selected Environment + Healthcare) → "Are you thinking about environmental health specifically, like water or air quality where you live?"

The LLM should ask one question per turn, accept "skip," and stop after 5 questions max.

**On the user's "maybe Google searches them" idea:** I'd push back on this. The cost-benefit is bad. Wrong-person hits are constant (common names), the people who'd value our product most are also the people most uncomfortable with being looked up, and the legal/PR exposure is real. The interview gets us 90% of the value without any of the risk.

### 8.4 Privacy as visible product, not just policy

Concrete things that should be visible in the UI:
- A "what we know about you" page that lists every field we've stored, in plain English, with edit and delete controls per field.
- The current data location ("Your data is in [region]. It's encrypted at rest.").
- A "delete everything" button that actually works and is one click + one confirmation.
- An "export my data" button that emails them a JSON file.
- A clear note on the LLM-drafted comments: "We send the rule text and your profile to Google's Gemini API to draft your comment. We do not retain those drafts on Google's servers. [link to Gemini's data policy]"

These aren't legal CYA — they're brand differentiators against the rest of the civic-tech space, which is sloppy with this.

---

## 9. Notifications — earning the inbox

Email is high-leverage and high-risk. One bad pattern (sending too much, sending generic, sending at midnight) and you're in the spam folder forever. Defaults matter.

### 9.1 Defaults

- **Digest:** weekly, Sunday 9am user-local time, top 5 rules matched to them that they haven't engaged with.
- **Closing-soon:** on for saved rules only by default. Three days before close, then on the morning of the last day. Never more than once per rule.
- **Final-rule alerts:** on by default for any rule the user commented on or saved. Sent the day the final rule posts.
- **Hard cap:** never more than 3 emails in any 7-day window unless the user has opted into daily digest.

### 9.2 Digest content

- 5 rules max. If we don't have 5 good ones, send 3. If we don't have 3, skip the digest that period.
- For each rule: title, agency, deadline ("closes in 9 days"), one-line LLM summary, match reason ("matches your Healthcare interest and Ohio location"), CTA button.
- Subject line should reference what's in the email, not be a generic "Your weekly digest." Example: "5 health rules close this month, including one on Medicare home visits."
- Plain-text version in the email always.
- One-click unsubscribe in the headers (RFC 8058) and a clear unsubscribe link in the footer.

### 9.3 The final-rule loop

This is the magic feature that turns OpenComment from a tool into a relationship.

**How we detect:** every night, for each docket in `docket_watch` (any docket where a user has saved or commented), call `/v4/dockets/{id}` and list the documents. Compare to `last_seen_documents`. If a new document with `documentType=Rule` (or `documentType=Notice` for withdrawals) appears, fire an event.

**What the email looks like:**
> "Six weeks ago you commented on the CMS proposed rule on home health reimbursement. Today, the agency posted the **final rule.** Here's what changed and what didn't.
>
> [LLM-generated diff summary, grounded in both documents — 'You said X. The agency adjusted from Y to Z, addressing this concern partially.' Or: 'You said X. The final rule did not change this provision. The agency's response section addressed it on page 47.']
>
> [link to final rule] [link to your original comment]"

**Caveat the user raised:** "how do we know if the change was good or bad based on them?" Honest answer — we can't reliably classify a rule change as good or bad for a specific user. What we *can* do is show them the change relative to what they said. We surface the comparison, not the verdict. The user gets to draw the conclusion. That's both more honest and lower-risk.

---

## 10. Saved & "I commented" — closing the loop

Both buttons currently exist as visual stubs. To make them real:

**Save:**
- Adds to `saved_regulations` table.
- Saved items appear in a dedicated "/saved" page.
- Saved items get closing-soon alerts by default.
- Visual: card shows a filled bookmark icon when saved.

**Mark as commented:**
- Two flows. (a) After clicking "Open on regulations.gov," when the user returns to OpenComment, we show a soft prompt: "Did you submit your comment on [rule name]?" If yes, we mark it. (b) On the detail page, an explicit "I submitted this comment" button.
- Optional: the user can paste back the final text they actually submitted (in case they edited heavily). Stored in `commented_regulations.comment_text`.
- Visual: card and detail page show a "Commented" pill with the date.
- Activity feed at "/activity" shows everything they've done, sorted reverse chronological.

---

## 11. Search & filtering

Right now the feed is one ranked list. That breaks the moment a user wants to see "all environmental rules" or "rules closing this week." Phase 1 filters:

- **Agency** (multi-select chip filter pulled from agencies present in current results)
- **Topic** (multi-select, from the user's onboarding topics + an "all topics" toggle)
- **Deadline urgency** (closing this week / this month / any)
- **Match score** (slider — "show me only 80%+ matches")
- **State relevance** (toggle: only show rules with explicit state impact)
- **Status** (open / saved / commented — quick toggles)

Sort options:
- Best match (default)
- Closing soonest
- Newest posted
- Most-commented (Phase 4 — pull comment counts from API)

**Search bar:**
- Real, server-side, hits `/v4/documents?filter[searchTerm]=<query>` with the user's other filters preserved.
- Debounced 300ms.
- Empty-state with suggested searches when no query.

---

## 12. Things I'd push back on or do differently

A few of the user's ideas that need adjustment:

- **"LLM Googles the user during onboarding."** Strong recommendation against. Wrong-person hits are extremely common (everyone has a namesake), the legal exposure is meaningful (CCPA, GDPR if we ever cross the Atlantic), and the privacy framing in §8 collapses if we do this. The adaptive interview gets us the same value safely.
- **"RAG for ranking."** Not the right tool. Embeddings for ranking, RAG for grounding LLM outputs in long rule texts. (Done. See §6 and §7.)
- **"Good or bad change classification on final rules."** Don't promise this. Show the diff, let the user judge. Otherwise we're either being dishonest or wading into a partisanship trap that destroys trust.
- **"Save button works"** — yes, in Phase 1. Don't do it before auth/DB are in, or you'll just be fighting `localStorage` again.
- **The "1,243 active right now" decorative stat in the right rail.** Remove it or make it real. Decorative metrics are a trust-killer once people notice (and they always notice).

---

## 13. Risks & open questions

| Risk | Mitigation |
|---|---|
| LLM-generated comments perceived as astroturf | The §7 discipline. Plus: never auto-submit, always require copy-paste, always anchor to user's real profile. The friction is the feature. |
| Costs spiral (LLM, email, DB) | Aggressive cache. Summaries generated once per rule, not per user. Email volume capped. Free tiers cover us until ~5k DAU. |
| regulations.gov rate limit | Nightly snapshot of all open Proposed Rules into our DB; per-user calls only on detail-page open. |
| User uploads sensitive personal info to the story bank | Clear warnings, encryption at rest, never used as model training data, easy delete. |
| Final rule detection misses or fires wrongly | Conservative: only fire on documents whose `documentType` is `Rule` or `Notice` AND whose `lastModifiedDate` is after we started watching. Manual review of first 50 fires before scaling. |
| Direct submission API misuse | Don't ship Phase 4 submission until we have explicit per-comment user confirmation, full audit log, and a kill switch. |
| Bad-faith use (orgs running thousands of fake users through us) | Email verification at minimum. Phase 4: device fingerprinting + rate limits per IP. We'd rather be small and clean than big and dirty. |
| Legal/compliance | Get a lawyer to review the privacy policy, ToS, and especially the comment-submission flow before Phase 4. |

Open questions to resolve before each phase:

- **Phase 1:** Clerk vs Supabase Auth? (lean Clerk for speed, Supabase if we want fewer vendors)
- **Phase 1:** Do we need a "create account to see feed" wall, or can the feed be public and only personalization require auth? (lean: feed public, personalization gated)
- **Phase 2:** What's the actual email frequency that doesn't burn out users? Test with first 200 users before defaults are locked.
- **Phase 3:** Embedding model — Gemini's `text-embedding-004` (768-dim) or OpenAI's `text-embedding-3-small`? Either works; pick by whoever else we're already paying.
- **Phase 4:** Is direct submission worth the integration cost? It's a meaningful UX win but adds significant compliance and abuse-vector load. May choose to permanently stay on copy-paste.

---

## 14. What "done" looks like for Phase 1

A user can:

1. Land on the public site, see real open rules without logging in
2. Sign up with email (magic link, no password)
3. Complete onboarding in under 2 minutes
4. See a personalized feed with real rules, real LLM summaries, real match reasons
5. Filter by agency, topic, deadline, state
6. Search the federal docket
7. Open a rule, read a real plain-language summary (not bureaucratese)
8. See an LLM-drafted comment that reads like an actual person wrote it
9. Edit the comment in-place
10. Copy the comment, click out to regulations.gov, submit it manually
11. Come back, mark it as commented
12. See their activity history at /activity
13. Save rules they want to come back to
14. Delete their account with one click and have all data actually deleted

Nothing in that list is faked. Nothing reads like AI sludge. Nothing requires the user to trust us with more than they want to share.

---

## 15. Suggested timeline (rough)

Hackathon-to-real-product is mostly about cutting scope, not adding it. Aggressive but realistic for a side-project pace:

- **Weeks 1-2:** Auth, DB, deployed. No new features. Just make `localStorage` → Postgres clean. (Phase 1 plumbing)
- **Weeks 3-4:** Gemini-powered summaries + comment drafting. Replace template generator. Tune prompts hard. (Phase 1 LLM)
- **Week 5:** Save, commented, activity page, filters, search. (Phase 1 product)
- **Week 6:** Privacy page, settings, account deletion, bug bash, soft launch to friends. (Phase 1 launch readiness)
- **Weeks 7-9:** Email digests + closing-soon + final-rule detection. (Phase 2)
- **Weeks 10-13:** Free-text input, story bank, embeddings, better ranking. (Phase 3)
- **Weeks 14+:** Edit-assist, direct submission, comments-like-yours. (Phase 4)

Phase 1 alone is a meaningful, deployable product. Don't wait for everything to ship before launching it.
