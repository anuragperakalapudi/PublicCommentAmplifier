# OpenComment

OpenComment is a hackathon demo for making federal rulemaking legible, searchable, and actionable for ordinary Americans.

Federal agencies propose thousands of rules every year that shape everyday life: how home health aides get paid, what counts as overtime, which medications are covered, what landlords can charge, and whether small businesses can navigate new compliance requirements. By law, agencies must read and respond to substantive public comments before finalizing those rules. Public comment is one of the rare places in American democracy where a person with lived experience can put something into the official record and legally require the government to answer it.

The problem is access. Regulations.gov is built for attorneys, lobbyists, policy shops, and trade associations. OpenComment gives everyone else a doorway in. The app collects a lightweight civic profile, pulls currently open proposed rules from regulations.gov, ranks them against the user's interests and life context, and generates a personalized draft comment that can be reviewed, edited, owned, and copied into the official comment form.

## Mission

Public Comment Amplifier exists to give every American the same access to federal rulemaking that lobbyists and trade associations already have.

We are not generating astroturf. We are not optimizing for volume. Every comment should be anchored to a real person and a real story, edited and approved by that person before submission. The goal is not to flood agencies with synthetic noise; it is to help people who were always supposed to be in the room finally get there.

Democracy is not only a vote every four years. It is also the thousand small windows that open and close every week, often without most Americans knowing they were open. OpenComment is built to make those windows visible.

## How It Works

OpenComment turns a hard civic workflow into a guided product flow:

1. A user describes who they are: state, occupation, household context, and issues they care about.
2. The app fetches open proposed rules from regulations.gov.
3. Local ranking logic scores rules against the user's selected topics and the rule text.
4. The feed highlights rules that are most likely to affect the user.
5. A regulation detail page explains the rule in plain language and links to the official docket.
6. The app drafts a substantive public comment grounded in the user's profile.
7. The user copies the draft, edits it if they want, and submits it through regulations.gov.

## What It Does

- Three-step onboarding for demographics, household context, state, occupation, and issue interests
- Personalized feed of open federal proposed rules from regulations.gov
- Local relevance ranking based on topic and keyword overlap
- Regulation detail pages with plain-language context, deadlines, and official regulations.gov links
- Generated comment drafts personalized to the user's profile and selected rule
- Copy-to-clipboard flow for moving the draft into the official comment box
- Local profile persistence with `localStorage`; no account or backend database required

## Product Principles

- **Human agency first:** the app drafts; the user reviews, edits, owns, and submits.
- **Substance over volume:** comments should be specific, relevant, and grounded in lived experience.
- **Official channels matter:** final submission happens through regulations.gov, the real federal record.
- **Plain language without dumbing down:** users should understand what is at stake without needing legal training.
- **Privacy by default for the demo:** profile data stays in local browser storage.

## Demo Scope

This repository is a presentational MVP built for a hackathon. It is designed to show the end-to-end experience clearly:

- The feed uses the real regulations.gov v4 documents API.
- The API key stays server-side in a Next.js route handler.
- Results are cached in memory for 5 minutes to keep the demo responsive.
- Ranking is intentionally simple and transparent.
- Comment generation is represented with deterministic, profile-aware draft templates rather than a live LLM call.
- The app does not submit comments directly; it sends users to the official regulations.gov page.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- React Context for profile state
- Framer Motion for transitions
- Lucide React icons
- regulations.gov v4 documents API

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Optional: regulations.gov API Key

The app uses `DEMO_KEY` when no API key is provided. That is fine for low-volume demo use, but a free API key is recommended for smoother testing.

1. Get a key from https://api.data.gov/signup/
2. Create a local env file:

```bash
cp .env.local.example .env.local
```

3. Set:

```bash
REGULATIONS_GOV_API_KEY=your_api_key_here
```

The server route at `app/api/regulations/route.ts` keeps the key server-side, fetches open proposed rules, and caches responses in memory for 5 minutes.

## Demo Flow

1. Start on the landing page and click **Build your civic profile**.
2. Complete onboarding with a realistic profile, such as a home health aide in Ohio interested in Healthcare and Labor.
3. Review the personalized feed of open proposed rules.
4. Open a regulation card to view the rule detail page.
5. Copy the generated comment draft.
6. Click **Open on regulations.gov** and paste the draft into the official comment box.

## Example Use Cases

- A home health aide finds a Medicare rule that affects telehealth access for homebound patients.
- A disabled veteran finds a benefits rule with a short comment window.
- A parent using SNAP finds a nutrition or eligibility rule before the deadline closes.
- A small farmer finds an agriculture or environmental rule that would change operating costs.
- A teacher or student borrower finds an education rule that affects repayment, access, or school accountability.

## Project Structure

```text
app/
  api/regulations/route.ts       Server-side regulations.gov fetch route
  feed/page.tsx                  Personalized regulation feed
  onboarding/page.tsx            Three-step civic profile flow
  regulation/[id]/page.tsx       Regulation detail and generated comment view
components/
  feed/                          Feed header, cards, and sidebar rail
  onboarding/                    Form fields, progress bar, topic chips
  regulation/                    Generated comment and copy button
  shared/                        Logo and agency badge
context/
  ProfileContext.tsx             Profile state and localStorage persistence
lib/
  mock/                          Demo regulation and comment template data
  profile.ts                     Profile storage helpers
  ranking.ts                     Relevance scoring and deadline formatting
  regulationsApi.ts              regulations.gov URL builder and response mapper
  types.ts                       Shared app types
```

## Notes

OpenComment is currently focused on demo clarity, not production completeness. It does not include authentication, a database, direct federal submission, analytics, moderation, or live LLM generation at request time.

The larger vision is a civic tool that helps people find the rules that affect them, understand the provisions at stake, and speak in a register agencies are required to take seriously without losing the user's own voice.
