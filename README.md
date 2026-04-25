# OpenComment

Hackathon demo. Helps ordinary Americans find federal rules that affect them and draft substantive public comments.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Optional: regulations.gov API key

The app falls back to `DEMO_KEY` (rate-limited but works for low traffic). For the demo, get a free key at https://api.data.gov/signup/ and set:

```bash
cp .env.local.example .env.local
# edit .env.local
```

If the API call fails or returns nothing, the feed silently falls back to a curated set of 10 hand-crafted regulations so the demo never shows a blank screen.

## Demo flow

1. Landing → click **Get started**
2. Onboarding (3 steps) → demographics + topics
3. Feed → personalized rules, ranked by profile fit
4. Click any card → regulation detail with auto-drafted comment + **Copy comment** + **Open on regulations.gov ↗**
