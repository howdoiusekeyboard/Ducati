# Ducati

Rational advice on your purchasing decisions. A Next.js + Firebase + OpenAI web app that analyzes proposed purchases against your financial profile and returns a buy / wait / skip recommendation with reasoning.

## What it does

- **Purchase Analyzer** — describe an item or upload a photo (GPT-4 Vision); receive a multi-factor decision (necessity, timing, affordability) with cheaper-alternative search.
- **Voice Advisor** — real-time voice session backed by OpenAI Realtime API; hands-free conversation about a specific purchase or general financial questions.
- **Pro Mode** — 3 model-generated probing questions per purchase + web-search-grounded analysis using current market data.
- **Dashboard** — savings tracker, expense breakdown, decision history, financial-health score (0–100).
- **Financial Profile** — income, expenses, debt, savings, goals, and risk tolerance feed every recommendation.

## Stack

- Next.js 14 App Router (minimal — primary client routing via React Router DOM v7)
- React 18 + TypeScript 5.8
- Firebase: Auth, Firestore (modular SDK v10), Storage
- OpenAI: GPT-4.1 (chat + vision), Realtime API (voice)
- Tailwind CSS v4
- Recharts (dashboard visualizations)
- Jest + Babel for tests

## Run locally

Requires Node 20+ and a package manager (`bun`, `pnpm`, `yarn`, or `npm`). The repo uses `bun` by default.

```bash
git clone https://github.com/howdoiusekeyboard/Ducati.git
cd Ducati
bun install
cp .env.example .env.local        # fill in OpenAI + Firebase keys
bun run check-env                  # validate env wiring
bun run dev                        # starts at http://localhost:3000
```

## Required environment variables

See `.env.example`. You will need:

- `OPENAI_API_KEY` — for chat, vision, and ephemeral Realtime tokens
- `NEXT_PUBLIC_FIREBASE_*` (six vars) — from your Firebase project's web app config
- `NEXT_PUBLIC_APP_NAME` — display name (defaults to `Ducati`)

The OpenAI key is server-side only. Firebase web config is intentionally client-exposed; access control lives in `firestore.rules` and `storage.rules`.

## Build and deploy

```bash
bun run build           # next build, output: 'standalone'
bun run start           # next start
```

Deployment target is Firebase App Hosting (`apphosting.yaml`, `firebase.json`).

```bash
bun run deploy          # build + firebase deploy
```

## Tests

```bash
bun jest                # all tests
bun run test:unit       # tests/unit
bun run test:integration  # tests/integration
bun run test:coverage   # with coverage
```

## Repository layout

```
src/
  app/                  Next.js App Router shell + API routes (chat, realtime/token)
  components/           Application components (mostly client-rendered)
  contexts/             React context providers (Auth, Voice)
  hooks/                Domain hooks (useFirestore, useChatApi, useRealtimeSession)
  lib/                  Firebase init, OpenAI integration, business logic
  styles/               Component CSS
firestore.rules         Firestore security rules
storage.rules           Storage security rules
tests/                  Jest unit + integration suites
```

## Status

The project is under active development. Core features are working in production; an in-flight dependency-modernization effort moves the stack to Node 24 LTS, Next 16, React 19 (with Compiler), Firebase 12, OpenAI v6, Tailwind v4 idiomatic CSS-first config, ESLint 10, and Jest 30. Track progress via release tags.
