# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status: implemented

The app, data layer, and Cloud Functions are built and deployed (Firebase project `pen-pal-dev`). The original implementation plan (`plan-penpal-v1.md`) defined the data model, architecture, and a test-first milestone breakdown; it has since been removed now that the code is the source of truth. Keep this file in sync as decisions change.

**Region:** Firestore `(default)` and both Cloud Functions live in **`asia-southeast1`**. A 2nd-gen Firestore trigger must run in the database's region, and the database's region is immutable — so do not change the function region away from the database's region without recreating the database to match.

## What PenPal is

A cross-platform mobile app (React Native + Expo, TypeScript) for couples/small groups learning each other's languages. Two people connect via an invite code, collect shared vocabulary, and study with flashcards and quiz games. The defining mechanic: a word entry stores **both** languages, and each member studies it toward **their own** target language — so the same shared word has independent, per-person, per-direction study progress.

## Commands

These are defined by the plan and become available once M0 (scaffolding) is executed:

- `npm start` — Expo dev server. **Requires a custom dev client build, not Expo Go** (native Google/Apple auth and push won't run in Expo Go).
- `npm test` — Jest tests for app logic (`src/domain`, `src/data`).
- `npm test -- <pattern>` — run a single test file/suite, e.g. `npm test -- srs`.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — ESLint.
- `npm run functions:test` — Cloud Functions tests (`npm --prefix functions test`).
- `npm --prefix functions run build` — compile Cloud Functions to `functions/lib`.

Backend deploy:
- `npx firebase deploy --only firestore:rules,firestore:indexes`
- `npx firebase deploy --only functions`

## Architecture (big picture)

**Three cooperating pieces:**

1. **Expo app** (`app/` routes via Expo Router, `src/` logic). File-based navigation with two route groups: `(auth)` (sign-in, onboarding) and `(app)` (tabs: lists, study, stats, settings). An auth gate in `app/_layout.tsx` redirects based on auth + onboarding state.

2. **Firebase** — Firestore (data + offline persistence), Auth (Google + Apple), and the client talks to it through thin data-layer modules.

3. **Cloud Functions** (`functions/`, separate npm package, Node 24, region `asia-southeast1`, Blaze plan) — provides two server-only capabilities the client cannot do safely: a **Google Cloud Translation proxy** (`translate`, keeps the API key server-side) and a Firestore **`onWordCreated`** trigger that sends partner-nudge push notifications (via the Expo Push service) and increments the word-trade counter.

**Layering convention (keep this separation):**
- `src/domain/` — **pure, dependency-free TypeScript** (SM-2 scheduler, fuzzy answer matching, invite codes, quiz builders, streaks, study-direction). All built test-first; this is the heart of the app and where most unit tests live.
- `src/data/` — Firestore read/write modules (no React).
- `src/hooks/` — React hooks wrapping realtime Firestore listeners.
- `src/services/` — external integrations (translate callable, notifications).
- `app/` — screens only; delegate logic to the layers above.

**Data model is deliberately denormalized.** Key decisions that aren't obvious from the code:
- A list's "type" is **implicit in membership count** (private = 1 member, shared = 2, group = 3+). There is no type field.
- A word can belong to many lists; copies share a stable **`groupId`**. Per-user study state lives under `users/{uid}/study/{groupId}`, so progress is unified across lists and private to each user.
- **Study direction is implicit**: a user is always shown the prompt in their native language and recalls the target language (`buildPromptAnswer`).
- The **word-trade counter is written server-side only** (in `onWordCreated`); security rules forbid client writes to `trades`. Do not also increment it from the client — that would double-count. Streaks, by contrast, are computed client-side because they depend on the user's local timezone.
- **Offline** works via Firestore's persistent local cache (configured in `src/firebase/config.ts`); studying offline reads from cache and syncs on reconnect.
- **"Close enough" typing answers**: Latin scripts get Levenshtein tolerance; Thai/CJK require an exact normalized match (edit distance is unreliable there).

## Conventions

## Code Standards and Practices

- Avoid `any` type; create proper TypeScript interfaces instead.
- Use `DateTime` from Luxon rather than native `Date` (except when interacting with Firestore or BigQuery APIs that require their own date types).
- Never use non-null assertions (e.g object['property']! )
- When making or editing methods split them into logical parts, keeping each part under 25-30 lines each.
- When possible, split files into  smaller parts, avoiding files much larger than 250-300 lines. Files can be split by components, utility functions, services, hooks, interfaces, types, constants etc. and each file should have a shared responsibility.
- File naming convention: use kebab-case for any new file.

## Testing Style

- Always add or update tests for any new important features especially for any critical cloud-functions.
- When adding tests, keep testing suites simple and direct, only testing the most important functionality.
- Follow existing testing patterns used in the project, and do not introduce new ones.


- **TDD for domain logic**: write the failing test, run it (expect FAIL), implement minimally, run again (expect PASS). The plan's tasks are structured this way.
- Secrets live in Cloud Functions runtime config (`firebase functions:secrets:set GOOGLE_TRANSLATE_API_KEY`) and a local `.env` (template: `.env.example`) — never in the app bundle or committed. Per repo policy, do not read or create `.env`; work through `.env.example`.
- Do not make commits unless explicitly asked.
