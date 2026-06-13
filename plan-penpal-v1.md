# PenPal v1 Implementation Plan

**Goal:** Build a cross-platform (iOS + Android) mobile app where two or more people learning each other's languages collect shared vocabulary and study it with flashcards and quiz games, each studying toward their own target language.

**Architecture:** A React Native + Expo (TypeScript) app talks to Firebase. Firestore stores a deliberately *denormalized* data model (users, lists, words, per-user/per-direction study state) and provides offline persistence + realtime sync. Firebase Auth handles Google/Apple sign-in. Firebase Cloud Functions (Blaze plan) provide two secured server capabilities: a Google Cloud Translation proxy and Firestore-triggered partner-nudge push notifications (delivered via the Expo Push service). The spaced-repetition scheduler (SM-2) and quiz logic run on-device as pure, unit-tested TypeScript.

**Tech Stack:**
- App: React Native + Expo SDK 51, TypeScript, Expo Router (file-based navigation), EAS Build + dev client, config plugins.
- Backend: Firebase — Firestore, Auth (Google + Apple), Cloud Functions (Node 20, TypeScript).
- Push: Expo Push Notifications service (wraps FCM/APNs).
- Translation: Google Cloud Translation API v2 (called only from a Cloud Function).
- State/data: Firestore realtime listeners wrapped in custom hooks; Zustand for transient UI/session state.
- Testing: Jest + ts-jest for logic and functions; @testing-library/react-native for components.

---

## Conventions used throughout this plan

- **TDD:** for every pure-logic module, write the failing test first, run it (expect FAIL), implement minimally, run again (expect PASS).
- **Exact paths:** all paths are relative to repo root `/Users/jesse/repos/pen-pal`.
- **Never read or create `.env`:** secrets go in `.env.example` (placeholders) and in EAS/Firebase config. The plan never writes a real `.env`.
- **No commits:** this plan deliberately contains no git operations.
- **"Representative UI code":** screen tasks include complete, working component code for the primary path. Where a screen is a straightforward variation of one already written, the task says so and shows the diff rather than repeating hundreds of lines — but every type/function it references is defined in an earlier task.

### Coding standards (from `CLAUDE.md`) — apply to every task

These are hard requirements; the code blocks below already follow them, but re-check as you implement:

- **No `any`.** Define a TypeScript interface for every external/JSON shape (e.g. the translation API response).
- **No native `Date`.** Use Luxon `DateTime` for all date/time work. The only exception is feeding milliseconds into Firestore's `Timestamp.fromMillis(...)` (a Firestore API requiring its own type) — get those millis from `DateTime`, never from `Date.now()`. All time access goes through `src/domain/clock.ts` (Task 2.0).
- **No non-null assertions (`!`).** Guard with early returns (`if (!x) return ...`) or narrow types instead. Route params and store values are typed as possibly-undefined and must be checked.
- **Small methods.** Keep each function/method under ~25–30 lines; extract helpers for distinct steps (this is why, e.g., the `on-word-created` trigger and `accept-invite` flow are split into helpers).
- **Small files.** Keep files under ~250–300 lines; split by responsibility (component / hook / util / types).
- **kebab-case filenames** for all `src/` and `functions/src/` files. (Expo Router files under `app/` keep their framework-mandated names, e.g. `[listId].tsx`.)
- **Tests:** keep suites simple and direct, covering the most important behavior; critical Cloud Functions logic must be tested. Follow the Jest + ts-jest patterns this plan establishes — do not introduce other test frameworks.

---

## File / module map

```
pen-pal/
  app/                                  # Expo Router screens (file-based routes)
    _layout.tsx                         # Root layout: auth gate + providers
    index.tsx                           # Redirect to /(auth) or /(app)
    (auth)/
      _layout.tsx
      sign-in.tsx                       # Google/Apple sign-in
      onboarding.tsx                    # pick native + target language
    (app)/
      _layout.tsx                       # Tab navigator
      lists/
        index.tsx                       # list of the user's lists
        [listId].tsx                    # words in a list
        new.tsx                         # create a list
        [listId]/members.tsx            # manage members / invite
      words/
        new.tsx                         # add a word (with auto-translate)
        [wordId].tsx                    # edit a word
      study/
        index.tsx                       # study hub: pick list + mode
        flashcards.tsx
        multiple-choice.tsx
        typing.tsx
        matching.tsx
      stats.tsx                         # streaks, leaderboard, trade counter
      join.tsx                          # accept invite code
      settings.tsx
  src/
    firebase/
      config.ts                         # initialize Firebase app + Firestore + Auth
      schema.ts                         # TypeScript types for all Firestore docs
      converters.ts                     # Firestore data converters
    domain/
      srs.ts                            # SM-2 scheduler (pure)
      answer-match.ts                   # "close enough" typing comparison (pure)
      invite-code.ts                    # invite code generation/validation (pure)
      languages.ts                      # supported languages list + helpers (pure)
      direction.ts                      # per-user study direction helpers (pure)
      quiz.ts                           # distractor selection + matching round build (pure)
      streak.ts                         # streak computation (pure)
      clock.ts                          # Luxon-based time helpers (now-ms, day key, day diff)
    data/
      users.ts                          # user profile read/write
      lists.ts                          # list CRUD + membership
      words.ts                          # word CRUD
      progress.ts                       # per-user/per-direction study state read/write
      invites.ts                        # invite create/accept
      push.ts                           # register Expo push token
    hooks/
      use-auth.ts                       # auth state + sign-in/out
      use-user-lists.ts                 # realtime user lists
      use-list-words.ts                 # realtime words in a list
      use-due-cards.ts                  # compute due cards for a study session
      use-stats.ts                      # streaks/leaderboard/trade counts
    services/
      translate.ts                      # calls the translate Cloud Function
      notifications.ts                  # local daily reminder scheduling + permissions
    ui/
      components/                       # shared presentational components
    store/
      session.ts                        # Zustand store (current study session, etc.)
  functions/                            # Firebase Cloud Functions (separate package)
    package.json
    tsconfig.json
    src/
      index.ts
      translate.ts                      # HTTPS callable: Google Translate proxy
      on-word-created.ts                # Firestore trigger -> partner nudge push
      expo-push.ts                      # helper to send Expo push messages
    test/
      translate.test.ts
      expo-push.test.ts
  firestore.rules                       # security rules
  firestore.indexes.json                # composite indexes
  firebase.json                         # firebase project config
  app.config.ts                         # Expo config (config plugins, env wiring)
  eas.json                              # EAS build profiles
  .env.example                          # placeholder env vars (NEVER a real .env)
  jest.config.js
  jest.setup.ts
  tsconfig.json
  package.json
  PRIVACY.md                            # privacy policy draft (app-store requirement)
```

---

## Firestore data model (denormalized) — reference for all tasks

Designed so the many-to-many relationships are cheap to query on mobile and enforceable in security rules.

### `users/{uid}`
```
{
  uid: string,
  displayName: string,
  email: string | null,
  photoURL: string | null,
  nativeLang: string,        // BCP-47-ish code, e.g. "en", "th"
  targetLang: string,        // the language THIS user is learning
  expoPushTokens: string[],  // device push tokens
  createdAt: Timestamp,
  // gamification denormalized counters (updated client-side in same batch as studies)
  streak: { current: number, longest: number, lastStudyDay: string /* "YYYY-MM-DD" in user's tz */ },
}
```

### `lists/{listId}`
```
{
  id: string,
  name: string,
  ownerUid: string,
  memberUids: string[],      // denormalized membership for cheap "where memberUids array-contains uid"
  members: {                 // per-member display info, denormalized for rendering without extra reads
    [uid: string]: { displayName: string, nativeLang: string, targetLang: string }
  },
  langA: string,             // the two languages this list pairs, sorted for stability
  langB: string,
  wordCount: number,         // denormalized counter
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```
A "private" list has `memberUids.length === 1`; "shared" === 2; "group" >= 3. There is no separate type field — membership *is* the type.

### `lists/{listId}/words/{wordId}`  (words are a subcollection of their list)
A word can appear in many lists: it is stored once per list it belongs to, linked by a stable `groupId` so progress can be unified across lists. (We denormalize by storing the word in each list's subcollection; `groupId` ties duplicates together for unified progress. This keeps security rules simple — read access follows the parent list — while still allowing "one logical word in many lists.")
```
{
  id: string,
  groupId: string,           // shared across all copies of the same logical word
  terms: {                   // both languages, keyed by language code
    [lang: string]: string   // e.g. { "th": "หมา", "en": "dog" }
  },
  notes: string,             // optional free text
  createdBy: string,         // uid
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedBy: string,         // last-write-wins authorship
}
```

### `users/{uid}/study/{groupId}`  (per-user, per-direction study state)
Progress lives under the *user*, keyed by `groupId`, so it is private to that user and unified across every list the word appears in. Direction is implicit: the user always studies toward their own `targetLang`.
```
{
  groupId: string,
  // SM-2 state
  ease: number,              // ease factor, starts 2.5
  intervalDays: number,      // current interval
  repetitions: number,       // consecutive correct count
  dueAt: Timestamp,          // next review time
  lastGrade: number,         // 0..5
  lastReviewedAt: Timestamp,
  // cached prompt/answer for offline study without needing the word doc:
  prompt: string,            // term in the user's NATIVE lang (shown)
  answer: string,            // term in the user's TARGET lang (recalled)
  sourceListId: string,      // a list this word came from (for context)
}
```

### `invites/{code}`
```
{
  code: string,              // short human-enterable code, e.g. "PNK-7Q2"
  listId: string,
  createdBy: string,
  createdAt: Timestamp,
  expiresAt: Timestamp,
  maxUses: number,
  uses: number,
  active: boolean,
}
```

### `trades/{pairKey}`  (word-trade counter between two users)
`pairKey` is the two uids sorted and joined: `uidA_uidB`.
```
{
  pairKey: string,
  counts: { [uid: string]: number }, // words each user has CONTRIBUTED that the other studies
  updatedAt: Timestamp,
}
```

---

## Milestone M0 — Project scaffolding & tooling

### Task 0.1: Initialize the Expo TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.config.ts`, `.env.example`

- [ ] **Step 1:** From repo root, scaffold Expo into the current (non-empty but git-only) directory:

```bash
npx create-expo-app@latest . --template expo-template-blank-typescript
```
If it refuses because the directory is non-empty, scaffold in a temp dir and move files:
```bash
npx create-expo-app@latest /tmp/penpal-scaffold --template expo-template-blank-typescript
rsync -a --exclude='.git' --exclude='.gitignore' /tmp/penpal-scaffold/ .
rm -rf /tmp/penpal-scaffold
```

- [ ] **Step 2:** Install runtime + dev dependencies:

```bash
npx expo install expo-router expo-secure-store expo-notifications expo-apple-authentication expo-crypto expo-localization react-native-safe-area-context react-native-screens
npm install firebase zustand luxon
npm install -D @types/luxon
npm install -D typescript @types/react jest ts-jest @types/jest @testing-library/react-native @testing-library/jest-native eslint prettier
```

- [ ] **Step 3:** Replace `package.json` `main` and scripts. Set:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "functions:test": "npm --prefix functions test"
  }
}
```

- [ ] **Step 4:** Create `.env.example` (placeholders only — never a real `.env`):

```
# Firebase Web SDK config (safe to ship in client, but kept here for clarity)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxx

# Google OAuth client IDs (for native Google sign-in)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com

# EAS project id (set by `eas init`)
EXPO_PUBLIC_EAS_PROJECT_ID=00000000-0000-0000-0000-000000000000
```
> Server-only secrets (the Google Cloud Translation API key) are NOT here — they live in Cloud Functions runtime config, never in the app bundle. See Task 6.2.

- [ ] **Step 5:** Run typecheck to confirm the toolchain works:

Run: `npm run typecheck`
Expected: no errors (empty/blank template compiles).

### Task 0.2: Configure Jest for pure-logic TDD

**Files:**
- Create: `jest.config.js`, `jest.setup.ts`

- [ ] **Step 1:** Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-router|zustand))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/data/**/*.ts'],
};
```

- [ ] **Step 2:** Install the Expo jest preset:

```bash
npx expo install jest-expo
```

- [ ] **Step 3:** Create `jest.setup.ts`:

```ts
import '@testing-library/jest-native/extend-expect';
```

- [ ] **Step 4:** Add a smoke test `src/domain/__tests__/smoke.test.ts`:

```ts
test('jest runs', () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 5:** Run it.

Run: `npm test -- src/domain/__tests__/smoke.test.ts`
Expected: 1 passing test. Then delete `smoke.test.ts`.

### Task 0.3: Expo Router + EAS configuration

**Files:**
- Create: `app/_layout.tsx`, `app/index.tsx`, `eas.json`, `firebase.json`
- Modify: `app.config.ts`

- [ ] **Step 1:** Create `app.config.ts` with config plugins for native auth/push:

```ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PenPal',
  slug: 'penpal',
  scheme: 'penpal',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'today.implemented.penpal',
    usesAppleSignIn: true,
  },
  android: {
    package: 'today.implemented.penpal',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    'expo-secure-store',
    [
      'expo-notifications',
      { icon: './assets/notification-icon.png', color: '#ffffff' },
    ],
  ],
  extra: {
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID },
  },
});
```

- [ ] **Step 2:** Create `eas.json`:

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

- [ ] **Step 3:** Create a minimal root layout `app/_layout.tsx` (auth providers wired in M2; placeholder now):

```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 4:** Create `app/index.tsx` placeholder:

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>PenPal</Text>
    </View>
  );
}
```

- [ ] **Step 5:** Create `firebase.json` (functions + rules wiring, used in later milestones):

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [{ "source": "functions", "codebase": "default" }]
}
```

- [ ] **Step 6:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M1 — Firebase wiring & data model types

### Task 1.1: Firebase client initialization

**Files:**
- Create: `src/firebase/config.ts`

- [ ] **Step 1:** Implement `src/firebase/config.ts` with offline persistence enabled:

```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Offline persistence: Firestore caches reads/writes on-device and syncs when online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);
```

> Note: this app studies offline via Firestore's persistent cache. `study` and `words` docs read while online are available offline automatically.

### Task 1.2: Firestore schema types

**Files:**
- Create: `src/firebase/schema.ts`

- [ ] **Step 1:** Create `src/firebase/schema.ts` matching the data model above exactly:

```ts
import { Timestamp } from 'firebase/firestore';

export interface StreakState {
  current: number;
  longest: number;
  lastStudyDay: string; // "YYYY-MM-DD" in user's local tz
}

export interface UserDoc {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  nativeLang: string;
  targetLang: string;
  expoPushTokens: string[];
  createdAt: Timestamp;
  streak: StreakState;
}

export interface ListMemberInfo {
  displayName: string;
  nativeLang: string;
  targetLang: string;
}

export interface ListDoc {
  id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  members: Record<string, ListMemberInfo>;
  langA: string;
  langB: string;
  wordCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WordDoc {
  id: string;
  groupId: string;
  terms: Record<string, string>; // keyed by language code
  notes: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface StudyDoc {
  groupId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Timestamp;
  lastGrade: number;
  lastReviewedAt: Timestamp;
  prompt: string;
  answer: string;
  sourceListId: string;
}

export interface InviteDoc {
  code: string;
  listId: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  maxUses: number;
  uses: number;
  active: boolean;
}

export interface TradeDoc {
  pairKey: string;
  counts: Record<string, number>;
  updatedAt: Timestamp;
}
```

- [ ] **Step 2:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M2 — Pure domain logic (TDD core)

This milestone has no Firebase or UI dependencies — fast, fully unit-tested. Build these first; they are the heart of the app.

### Task 2.0: Clock helpers (Luxon)

Centralizes all time access so no other module touches native `Date`. Everything that needs "now", a day key, or a day difference uses these.

**Files:**
- Create: `src/domain/clock.ts`, `src/domain/__tests__/clock.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/clock.test.ts`:

```ts
import { nowMs, msFromIso, dayKey, dayDiff } from '../clock';

test('msFromIso parses an ISO instant to epoch ms', () => {
  expect(msFromIso('2026-06-14T08:00:00Z')).toBe(Date.UTC(2026, 5, 14, 8, 0, 0));
});

test('nowMs returns a positive integer', () => {
  const t = nowMs();
  expect(Number.isInteger(t)).toBe(true);
  expect(t).toBeGreaterThan(0);
});

test('dayKey formats a date-only key from an ISO date', () => {
  expect(dayKey('2026-06-14')).toBe('2026-06-14');
});

test('dayDiff counts whole days between two day keys', () => {
  expect(dayDiff('2026-06-13', '2026-06-14')).toBe(1);
  expect(dayDiff('2026-06-13', '2026-06-13')).toBe(0);
  expect(dayDiff('2026-06-13', '2026-06-15')).toBe(2);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- clock`

- [ ] **Step 3: Implement** `src/domain/clock.ts`:

```ts
import { DateTime } from 'luxon';

/** Current time as epoch milliseconds. The one place "now" enters the app. */
export function nowMs(): number {
  return DateTime.now().toMillis();
}

/** Parse an ISO instant string to epoch milliseconds. */
export function msFromIso(iso: string): number {
  return DateTime.fromISO(iso, { zone: 'utc' }).toMillis();
}

/** Today's local-time day key, "yyyy-MM-dd". */
export function todayKey(): string {
  return DateTime.now().toFormat('yyyy-MM-dd');
}

/** Normalize/echo a day key ("yyyy-MM-dd"). */
export function dayKey(isoDate: string): string {
  return DateTime.fromISO(isoDate, { zone: 'utc' }).toFormat('yyyy-MM-dd');
}

/** Whole-day difference between two day keys (b - a). */
export function dayDiff(a: string, b: string): number {
  const da = DateTime.fromISO(a, { zone: 'utc' }).startOf('day');
  const db = DateTime.fromISO(b, { zone: 'utc' }).startOf('day');
  return Math.round(db.diff(da, 'days').days);
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- clock` → all pass.

### Task 2.1: Supported languages helper

**Files:**
- Create: `src/domain/languages.ts`, `src/domain/__tests__/languages.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/languages.test.ts`:

```ts
import { LANGUAGES, getLanguageName, isSupported } from '../languages';

test('includes Thai and English', () => {
  expect(isSupported('th')).toBe(true);
  expect(isSupported('en')).toBe(true);
});

test('maps code to display name', () => {
  expect(getLanguageName('th')).toBe('Thai');
  expect(getLanguageName('en')).toBe('English');
});

test('unknown code is not supported and falls back to the code', () => {
  expect(isSupported('zz')).toBe(false);
  expect(getLanguageName('zz')).toBe('zz');
});

test('language list is non-empty and unique', () => {
  const codes = LANGUAGES.map((l) => l.code);
  expect(codes.length).toBeGreaterThan(10);
  expect(new Set(codes).size).toBe(codes.length);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- languages`

- [ ] **Step 3: Implement** `src/domain/languages.ts`:

```ts
export interface Language {
  code: string;
  name: string;
}

// Codes are Google Cloud Translation v2 source/target codes.
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'th', name: 'Thai' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
];

const NAME_BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l.name]));

export function isSupported(code: string): boolean {
  return NAME_BY_CODE.has(code);
}

export function getLanguageName(code: string): string {
  return NAME_BY_CODE.get(code) ?? code;
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- languages` → all pass.

### Task 2.2: SM-2 spaced-repetition scheduler

**Files:**
- Create: `src/domain/srs.ts`, `src/domain/__tests__/srs.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/srs.test.ts`:

```ts
import { initialSrs, schedule, SrsState, isDue } from '../srs';
import { msFromIso } from '../clock';

const NOW = msFromIso('2026-06-14T08:00:00Z');

test('initial state is due immediately with default ease', () => {
  const s = initialSrs(NOW);
  expect(s.ease).toBeCloseTo(2.5);
  expect(s.repetitions).toBe(0);
  expect(s.intervalDays).toBe(0);
  expect(isDue(s, NOW)).toBe(true);
});

test('first correct answer (grade>=3) sets interval to 1 day', () => {
  const s = schedule(initialSrs(NOW), 4, NOW);
  expect(s.repetitions).toBe(1);
  expect(s.intervalDays).toBe(1);
});

test('second consecutive correct sets interval to 6 days', () => {
  let s = schedule(initialSrs(NOW), 4, NOW);
  s = schedule(s, 4, NOW + 86400000);
  expect(s.repetitions).toBe(2);
  expect(s.intervalDays).toBe(6);
});

test('third correct multiplies interval by ease', () => {
  let s = schedule(initialSrs(NOW), 5, NOW);
  s = schedule(s, 5, NOW);
  const before = s.intervalDays; // 6
  const easeBefore = s.ease; // SM-2 uses the pre-update ease for the next interval
  s = schedule(s, 5, NOW);
  expect(s.intervalDays).toBe(Math.round(before * easeBefore));
});

test('a wrong answer (grade<3) resets repetitions and interval to 1', () => {
  let s = schedule(initialSrs(NOW), 5, NOW);
  s = schedule(s, 5, NOW); // interval 6
  s = schedule(s, 1, NOW); // lapse
  expect(s.repetitions).toBe(0);
  expect(s.intervalDays).toBe(1);
});

test('ease never drops below 1.3', () => {
  let s = initialSrs(NOW);
  for (let i = 0; i < 20; i++) s = schedule(s, 0, NOW);
  expect(s.ease).toBeGreaterThanOrEqual(1.3);
});

test('dueAt advances by intervalDays', () => {
  const s = schedule(initialSrs(NOW), 4, NOW);
  expect(s.dueAt).toBe(NOW + 1 * 86400000);
  expect(isDue(s, NOW)).toBe(false);
  expect(isDue(s, NOW + 86400000)).toBe(true);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- srs`

- [ ] **Step 3: Implement** `src/domain/srs.ts` (classic SM-2):

```ts
const DAY_MS = 86400000;
const MIN_EASE = 1.3;

export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;        // epoch ms
  lastGrade: number;
  lastReviewedAt: number;
}

export function initialSrs(now: number): SrsState {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now,         // due immediately
    lastGrade: -1,
    lastReviewedAt: 0,
  };
}

export function isDue(s: SrsState, now: number): boolean {
  return s.dueAt <= now;
}

/**
 * SM-2. grade in 0..5. grade>=3 is a "correct" recall.
 */
export function schedule(prev: SrsState, grade: number, now: number): SrsState {
  const g = Math.max(0, Math.min(5, Math.round(grade)));
  let { ease, intervalDays, repetitions } = prev;

  if (g < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
  }

  // SM-2 ease update
  ease = ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  return {
    ease,
    intervalDays,
    repetitions,
    dueAt: now + intervalDays * DAY_MS,
    lastGrade: g,
    lastReviewedAt: now,
  };
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- srs` → all pass.

### Task 2.3: "Close enough" typing answer matcher

**Files:**
- Create: `src/domain/answer-match.ts`, `src/domain/__tests__/answer-match.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/answer-match.test.ts`:

```ts
import { normalize, isAcceptable } from '../answer-match';

test('normalize trims, lowercases, strips punctuation and extra spaces', () => {
  expect(normalize('  The   Dog! ')).toBe('the dog');
});

test('exact match (after normalize) is acceptable', () => {
  expect(isAcceptable('dog', 'Dog')).toBe(true);
});

test('accepts a one-character typo in a short word', () => {
  expect(isAcceptable('dog', 'dgo')).toBe(true); // transposition, distance small
});

test('rejects a clearly wrong answer', () => {
  expect(isAcceptable('dog', 'cat')).toBe(false);
});

test('accepts alternative answers separated by slash or comma', () => {
  expect(isAcceptable('hello / hi', 'hi')).toBe(true);
  expect(isAcceptable('big, large', 'large')).toBe(true);
});

test('non-latin (Thai) requires exact normalized match (no fuzz)', () => {
  expect(isAcceptable('หมา', 'หมา')).toBe(true);
  expect(isAcceptable('หมา', 'หมาก')).toBe(false);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- answer-match`

- [ ] **Step 3: Implement** `src/domain/answer-match.ts`:

```ts
export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:"'()¿¡]/g, '')
    .replace(/\s+/g, ' ');
}

// Damerau–Levenshtein (optimal string alignment): like Levenshtein but counts an
// adjacent transposition (e.g. "dog" -> "dgo") as a single edit, since transpositions
// are among the most common typos.
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

// Latin script gets fuzzy tolerance; non-latin requires exact normalized match,
// because edit distance on complex scripts (Thai, CJK) is unreliable.
function isLatin(s: string): boolean {
  return /^[\x00-\x7FÀ-ɏ\s]*$/.test(s);
}

/**
 * `expected` may contain several acceptable answers separated by `/` or `,`.
 */
export function isAcceptable(expected: string, given: string): boolean {
  const candidates = expected
    .split(/[/,]/)
    .map(normalize)
    .filter(Boolean);
  const g = normalize(given);
  if (!g) return false;

  for (const c of candidates) {
    if (c === g) return true;
    if (isLatin(c) && isLatin(g)) {
      const dist = editDistance(c, g);
      const tolerance = c.length <= 4 ? 1 : c.length <= 8 ? 2 : 3;
      if (dist <= tolerance) return true;
    }
  }
  return false;
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- answer-match` → all pass.

### Task 2.4: Invite code generator/validator

**Files:**
- Create: `src/domain/invite-code.ts`, `src/domain/__tests__/invite-code.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/invite-code.test.ts`:

```ts
import { generateInviteCode, isValidInviteFormat, normalizeInviteCode } from '../invite-code';

test('generated code matches XXX-XXX format with unambiguous charset', () => {
  for (let i = 0; i < 100; i++) {
    const code = generateInviteCode(() => Math.random());
    expect(isValidInviteFormat(code)).toBe(true);
    expect(code).not.toMatch(/[O0I1L]/); // ambiguous chars excluded
  }
});

test('normalize uppercases and inserts the dash', () => {
  expect(normalizeInviteCode('pnk7q2')).toBe('PNK-7Q2');
  expect(normalizeInviteCode('pnk-7q2')).toBe('PNK-7Q2');
  expect(normalizeInviteCode(' Pnk 7Q2 ')).toBe('PNK-7Q2');
});

test('invalid formats are rejected', () => {
  expect(isValidInviteFormat('AB-123')).toBe(false);
  expect(isValidInviteFormat('ABCD-123')).toBe(false);
  expect(isValidInviteFormat('PNK-7Q2')).toBe(true);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- invite-code`

- [ ] **Step 3: Implement** `src/domain/invite-code.ts`:

```ts
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O,0,I,1,L

export function generateInviteCode(rng: () => number = Math.random): string {
  const pick = () => ALPHABET[Math.floor(rng() * ALPHABET.length)];
  const block = () => pick() + pick() + pick();
  return `${block()}-${block()}`;
}

export function normalizeInviteCode(input: string): string {
  const raw = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return raw.length === 6 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : raw;
}

export function isValidInviteFormat(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{3}-[${ALPHABET}]{3}$`).test(code);
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- invite-code` → all pass.

### Task 2.5: Study direction helper

**Files:**
- Create: `src/domain/direction.ts`, `src/domain/__tests__/direction.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/direction.test.ts`:

```ts
import { buildPromptAnswer } from '../direction';

const terms = { th: 'หมา', en: 'dog' };

test('English learner is prompted in native (their own lang) and recalls target', () => {
  // user native en, target th -> shown English, must recall Thai
  expect(buildPromptAnswer(terms, 'en', 'th')).toEqual({ prompt: 'dog', answer: 'หมา' });
});

test('Thai learner is shown Thai, recalls English', () => {
  expect(buildPromptAnswer(terms, 'th', 'en')).toEqual({ prompt: 'หมา', answer: 'dog' });
});

test('returns null if either side is missing', () => {
  expect(buildPromptAnswer({ en: 'dog' }, 'en', 'th')).toBeNull();
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- direction`

- [ ] **Step 3: Implement** `src/domain/direction.ts`:

```ts
export interface PromptAnswer {
  prompt: string; // shown to the user (their NATIVE language)
  answer: string; // what they must recall (their TARGET language)
}

/**
 * The user always studies toward their target language: we show them the word
 * in their native language and ask them to recall the target-language term.
 */
export function buildPromptAnswer(
  terms: Record<string, string>,
  nativeLang: string,
  targetLang: string
): PromptAnswer | null {
  const prompt = terms[nativeLang];
  const answer = terms[targetLang];
  if (!prompt || !answer) return null;
  return { prompt, answer };
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- direction` → all pass.

### Task 2.6: Quiz helpers (distractors + matching rounds)

**Files:**
- Create: `src/domain/quiz.ts`, `src/domain/__tests__/quiz.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/quiz.test.ts`:

```ts
import { buildMultipleChoice, buildMatchingRound, Card } from '../quiz';

const cards: Card[] = [
  { groupId: 'a', prompt: 'dog', answer: 'หมา' },
  { groupId: 'b', prompt: 'cat', answer: 'แมว' },
  { groupId: 'c', prompt: 'bird', answer: 'นก' },
  { groupId: 'd', prompt: 'fish', answer: 'ปลา' },
  { groupId: 'e', prompt: 'cow', answer: 'วัว' },
];

let seed = 42;
const rng = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

test('multiple choice returns the correct answer plus N-1 distractors, all unique', () => {
  const q = buildMultipleChoice(cards[0], cards, 4, rng);
  expect(q.options).toContain('หมา');
  expect(q.options.length).toBe(4);
  expect(new Set(q.options).size).toBe(4);
  expect(q.correct).toBe('หมา');
});

test('multiple choice with fewer than N cards returns as many as available', () => {
  const q = buildMultipleChoice(cards[0], cards.slice(0, 2), 4, rng);
  expect(q.options.length).toBe(2);
  expect(q.options).toContain('หมา');
});

test('matching round pairs prompts to answers with stable ids', () => {
  const round = buildMatchingRound(cards, 4, rng);
  expect(round.prompts.length).toBe(4);
  expect(round.answers.length).toBe(4);
  // every prompt id has a matching answer id
  const answerIds = new Set(round.answers.map((a) => a.groupId));
  for (const p of round.prompts) expect(answerIds.has(p.groupId)).toBe(true);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- quiz`

- [ ] **Step 3: Implement** `src/domain/quiz.ts`:

```ts
export interface Card {
  groupId: string;
  prompt: string;
  answer: string;
}

export interface MultipleChoiceQuestion {
  card: Card;
  correct: string;
  options: string[];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildMultipleChoice(
  card: Card,
  pool: Card[],
  count: number,
  rng: () => number = Math.random
): MultipleChoiceQuestion {
  const distractors = shuffle(
    pool.filter((c) => c.groupId !== card.groupId).map((c) => c.answer),
    rng
  ).slice(0, Math.max(0, count - 1));
  const options = shuffle([card.answer, ...distractors], rng);
  return { card, correct: card.answer, options };
}

export interface MatchingRound {
  prompts: Card[];
  answers: Card[];
}

export function buildMatchingRound(
  pool: Card[],
  size: number,
  rng: () => number = Math.random
): MatchingRound {
  const chosen = shuffle(pool, rng).slice(0, Math.min(size, pool.length));
  return {
    prompts: shuffle(chosen, rng),
    answers: shuffle(chosen, rng),
  };
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- quiz` → all pass.

### Task 2.7: Streak computation

**Files:**
- Create: `src/domain/streak.ts`, `src/domain/__tests__/streak.test.ts`

- [ ] **Step 1: Write the failing test** `src/domain/__tests__/streak.test.ts`:

```ts
import { applyStudyDay, StreakState } from '../streak';

const base: StreakState = { current: 3, longest: 5, lastStudyDay: '2026-06-13' };

test('studying the next day increments current streak', () => {
  const s = applyStudyDay(base, '2026-06-14');
  expect(s.current).toBe(4);
  expect(s.longest).toBe(5);
});

test('studying the same day is a no-op', () => {
  const s = applyStudyDay(base, '2026-06-13');
  expect(s.current).toBe(3);
});

test('skipping a day resets current streak to 1', () => {
  const s = applyStudyDay(base, '2026-06-15');
  expect(s.current).toBe(1);
});

test('new longest is recorded', () => {
  const s = applyStudyDay({ current: 5, longest: 5, lastStudyDay: '2026-06-13' }, '2026-06-14');
  expect(s.current).toBe(6);
  expect(s.longest).toBe(6);
});

test('first ever study day starts streak at 1', () => {
  const s = applyStudyDay({ current: 0, longest: 0, lastStudyDay: '' }, '2026-06-14');
  expect(s.current).toBe(1);
  expect(s.longest).toBe(1);
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm test -- streak`

- [ ] **Step 3: Implement** `src/domain/streak.ts`:

```ts
import { dayDiff } from './clock';

export interface StreakState {
  current: number;
  longest: number;
  lastStudyDay: string; // "yyyy-MM-dd"
}

export function applyStudyDay(prev: StreakState, today: string): StreakState {
  if (!prev.lastStudyDay) {
    return { current: 1, longest: Math.max(1, prev.longest), lastStudyDay: today };
  }
  const diff = dayDiff(prev.lastStudyDay, today);
  if (diff === 0) return prev;
  const current = diff === 1 ? prev.current + 1 : 1;
  return {
    current,
    longest: Math.max(prev.longest, current),
    lastStudyDay: today,
  };
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm test -- streak` → all pass. Then run the whole domain suite:

Run: `npm test -- src/domain`
Expected: all domain tests pass.

---

## Milestone M3 — Auth & user profile

### Task 3.1: Auth hook (Google + Apple)

**Files:**
- Create: `src/hooks/use-auth.ts`, `src/data/users.ts`

- [ ] **Step 1:** Install native auth helpers:

```bash
npx expo install expo-auth-session expo-web-browser
```

- [ ] **Step 2:** Implement `src/data/users.ts`:

```ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserDoc } from '../firebase/schema';

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function createUserIfMissing(params: {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
}): Promise<void> {
  const ref = doc(db, 'users', params.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: params.uid,
    displayName: params.displayName,
    email: params.email,
    photoURL: params.photoURL,
    nativeLang: '',
    targetLang: '',
    expoPushTokens: [],
    createdAt: serverTimestamp(),
    streak: { current: 0, longest: 0, lastStudyDay: '' },
  });
}

export async function setLanguages(uid: string, nativeLang: string, targetLang: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { nativeLang, targetLang });
}
```

- [ ] **Step 3:** Implement `src/hooks/use-auth.ts`:

```ts
import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../firebase/config';
import { createUserIfMissing, getUser } from '../data/users';
import { UserDoc } from '../firebase/schema';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await createUserIfMissing({
          uid: u.uid,
          displayName: u.displayName ?? 'Learner',
          email: u.email,
          photoURL: u.photoURL,
        });
        setProfile(await getUser(u.uid));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential);
    }
  }, [googleResponse]);

  async function signInWithApple() {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!cred.identityToken) throw new Error('Apple sign-in returned no identity token');
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: cred.identityToken });
    await signInWithCredential(auth, credential);
  }

  return {
    user,
    profile,
    loading,
    needsOnboarding: !!user && !!profile && (!profile.nativeLang || !profile.targetLang),
    signInWithGoogle: () => promptGoogle(),
    signInWithApple,
    signOut: () => fbSignOut(auth),
    refreshProfile: async () => user && setProfile(await getUser(user.uid)),
  };
}
```

> Note: full Google/Apple provider setup in Firebase console and the OAuth client IDs are operational steps documented in `README` (Task 9.3), not code.

### Task 3.2: Auth gate in root layout

**Files:**
- Modify: `app/_layout.tsx`
- Create: `src/store/session.ts`

- [ ] **Step 1:** Create `src/store/session.ts`:

```ts
import { create } from 'zustand';
import { UserDoc } from '../firebase/schema';

interface SessionState {
  profile: UserDoc | null;
  setProfile: (p: UserDoc | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));

/**
 * Returns the signed-in user's profile, guaranteed non-null.
 * Every `(app)` screen renders behind the auth gate in `app/_layout.tsx`,
 * so the profile is always present here. Throwing (instead of a non-null
 * assertion) keeps the code free of `!` while staying fully typed.
 */
export function useProfile(): UserDoc {
  const profile = useSession((s) => s.profile);
  if (!profile) {
    throw new Error('useProfile must be used within an authenticated (app) screen');
  }
  return profile;
}
```

- [ ] **Step 2:** Replace `app/_layout.tsx` with an auth gate:

```tsx
import { useEffect } from 'react';
import { Redirect, Slot, useSegments, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/use-auth';
import { useSession } from '../src/store/session';

export default function RootLayout() {
  const { user, profile, loading, needsOnboarding } = useAuth();
  const setProfile = useSession((s) => s.setProfile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/sign-in');
    else if (user && needsOnboarding) router.replace('/(auth)/onboarding');
    else if (user && !needsOnboarding && inAuthGroup) router.replace('/(app)/lists');
  }, [user, loading, needsOnboarding, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
```

### Task 3.3: Sign-in screen

**Files:**
- Create: `app/(auth)/_layout.tsx`, `app/(auth)/sign-in.tsx`

- [ ] **Step 1:** Create `app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2:** Create `app/(auth)/sign-in.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../src/hooks/use-auth';

export default function SignIn() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PenPal</Text>
      <Text style={styles.subtitle}>Learn each other's language, together.</Text>

      <Pressable style={styles.googleBtn} onPress={() => signInWithGoogle()}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleBtn}
          onPress={signInWithApple}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, color: '#555' },
  googleBtn: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 8, alignItems: 'center' },
  googleText: { color: 'white', fontWeight: '600', fontSize: 16 },
  appleBtn: { height: 52 },
});
```

### Task 3.4: Onboarding (pick native + target language)

**Files:**
- Create: `app/(auth)/onboarding.tsx`

- [ ] **Step 1:** Create `app/(auth)/onboarding.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { LANGUAGES } from '../../src/domain/languages';
import { setLanguages } from '../../src/data/users';
import { useAuth } from '../../src/hooks/use-auth';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [nativeLang, setNative] = useState('');
  const [targetLang, setTarget] = useState('');

  async function save() {
    if (!user || !nativeLang || !targetLang || nativeLang === targetLang) return;
    await setLanguages(user.uid, nativeLang, targetLang);
    await refreshProfile();
    router.replace('/(app)/lists');
  }

  const Picker = ({ label, value, onPick }: { label: string; value: string; onPick: (c: string) => void }) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <FlatList
        data={LANGUAGES}
        keyExtractor={(l) => l.code}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, value === item.code && styles.rowActive]}
            onPress={() => onPick(item.code)}
          >
            <Text>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your languages</Text>
      <View style={styles.cols}>
        <Picker label="I speak (native)" value={nativeLang} onPick={setNative} />
        <Picker label="I'm learning (target)" value={targetLang} onPick={setTarget} />
      </View>
      {nativeLang === targetLang && nativeLang !== '' && (
        <Text style={styles.error}>Native and target must differ.</Text>
      )}
      <Button title="Continue" onPress={save} disabled={!nativeLang || !targetLang || nativeLang === targetLang} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  cols: { flex: 1, flexDirection: 'row', gap: 12 },
  label: { fontWeight: '600', marginBottom: 8 },
  row: { padding: 12, borderRadius: 8 },
  rowActive: { backgroundColor: '#d6e4ff' },
  error: { color: 'red' },
});
```

- [ ] **Step 2:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M4 — Lists & membership

### Task 4.1: Lists data layer

**Files:**
- Create: `src/data/lists.ts`

- [ ] **Step 1:** Implement `src/data/lists.ts`:

```ts
import {
  collection, doc, addDoc, getDoc, updateDoc, deleteDoc, query, where,
  serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ListDoc, ListMemberInfo, UserDoc } from '../firebase/schema';

export function userListsQuery(uid: string) {
  return query(collection(db, 'lists'), where('memberUids', 'array-contains', uid));
}

export async function createList(params: {
  name: string;
  owner: UserDoc;
  langA: string;
  langB: string;
}): Promise<string> {
  const memberInfo: ListMemberInfo = {
    displayName: params.owner.displayName,
    nativeLang: params.owner.nativeLang,
    targetLang: params.owner.targetLang,
  };
  const ref = await addDoc(collection(db, 'lists'), {
    name: params.name,
    ownerUid: params.owner.uid,
    memberUids: [params.owner.uid],
    members: { [params.owner.uid]: memberInfo },
    langA: params.langA,
    langB: params.langB,
    wordCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addMember(listId: string, member: UserDoc): Promise<void> {
  await updateDoc(doc(db, 'lists', listId), {
    memberUids: arrayUnion(member.uid),
    [`members.${member.uid}`]: {
      displayName: member.displayName,
      nativeLang: member.nativeLang,
      targetLang: member.targetLang,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function removeMember(listId: string, uid: string): Promise<void> {
  const ref = doc(db, 'lists', listId);
  const snap = await getDoc(ref);
  const data = snap.data() as ListDoc;
  const members = { ...data.members };
  delete members[uid];
  await updateDoc(ref, {
    memberUids: arrayRemove(uid),
    members,
    updatedAt: serverTimestamp(),
  });
}

export async function renameList(listId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'lists', listId), { name, updatedAt: serverTimestamp() });
}

export async function deleteList(listId: string): Promise<void> {
  await deleteDoc(doc(db, 'lists', listId));
}

export function bumpWordCount(listId: string, delta: number) {
  return updateDoc(doc(db, 'lists', listId), {
    wordCount: increment(delta),
    updatedAt: serverTimestamp(),
  });
}
```

### Task 4.2: Realtime user-lists hook

**Files:**
- Create: `src/hooks/use-user-lists.ts`

- [ ] **Step 1:** Implement `src/hooks/use-user-lists.ts`:

```ts
import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { userListsQuery } from '../data/lists';
import { ListDoc } from '../firebase/schema';

export function useUserLists(uid: string | undefined) {
  const [lists, setLists] = useState<ListDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(userListsQuery(uid), (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ListDoc));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { lists, loading };
}
```

### Task 4.3: Lists tab — list, create, classify

**Files:**
- Create: `app/(app)/_layout.tsx`, `app/(app)/lists/index.tsx`, `app/(app)/lists/new.tsx`
- Create: `src/ui/components/list-card.tsx`

- [ ] **Step 1:** Create the tab navigator `app/(app)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="lists/index" options={{ title: 'Lists' }} />
      <Tabs.Screen name="study/index" options={{ title: 'Study' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* hidden routes */}
      <Tabs.Screen name="lists/[listId]" options={{ href: null }} />
      <Tabs.Screen name="lists/new" options={{ href: null }} />
      <Tabs.Screen name="lists/[listId]/members" options={{ href: null }} />
      <Tabs.Screen name="words/new" options={{ href: null }} />
      <Tabs.Screen name="words/[wordId]" options={{ href: null }} />
      <Tabs.Screen name="study/flashcards" options={{ href: null }} />
      <Tabs.Screen name="study/multiple-choice" options={{ href: null }} />
      <Tabs.Screen name="study/typing" options={{ href: null }} />
      <Tabs.Screen name="study/matching" options={{ href: null }} />
      <Tabs.Screen name="join" options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2:** Create `src/ui/components/list-card.tsx` (classifies membership for display):

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ListDoc } from '../../firebase/schema';

function membershipLabel(n: number): string {
  if (n <= 1) return 'Private';
  if (n === 2) return 'Shared';
  return `Group · ${n}`;
}

export function ListCard({ list, onPress }: { list: ListDoc; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{list.name}</Text>
      <Text style={styles.meta}>
        {membershipLabel(list.memberUids.length)} · {list.wordCount} words
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f4f6', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '600' },
  meta: { color: '#6b7280', marginTop: 4 },
});
```

- [ ] **Step 3:** Create `app/(app)/lists/index.tsx`:

```tsx
import { View, FlatList, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { ListCard } from '../../../src/ui/components/list-card';

export default function ListsScreen() {
  const profile = useProfile();
  const { lists } = useUserLists(profile?.uid);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <ListCard list={item} onPress={() => router.push(`/(app)/lists/${item.id}`)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No lists yet. Create one below.</Text>}
      />
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => router.push('/(app)/lists/new')}>
          <Text style={styles.primaryText}>+ New list</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/(app)/join')}>
          <Text>Join with code</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  actions: { gap: 8 },
  primary: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '700' },
  secondary: { padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#e5e7eb' },
});
```

- [ ] **Step 4:** Create `app/(app)/lists/new.tsx`. The list's two languages default to the creator's native+target but are editable:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../src/store/session';
import { createList } from '../../../src/data/lists';

export default function NewList() {
  const profile = useProfile();
  const router = useRouter();
  const [name, setName] = useState('');

  async function create() {
    if (!name.trim()) return;
    const [langA, langB] = [profile.nativeLang, profile.targetLang].sort();
    const id = await createList({ name: name.trim(), owner: profile, langA, langB });
    router.replace(`/(app)/lists/${id}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>List name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Food & Drinks"
        autoFocus
      />
      <Button title="Create" onPress={create} disabled={!name.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
});
```

- [ ] **Step 5:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M5 — Words & auto-translate

### Task 5.1: Words data layer

**Files:**
- Create: `src/data/words.ts`

- [ ] **Step 1:** Implement `src/data/words.ts`. Adding a word to multiple lists writes one doc per list sharing a `groupId`:

```ts
import {
  collection, doc, addDoc, setDoc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from '../firebase/config';
import { WordDoc } from '../firebase/schema';
import { bumpWordCount } from './lists';

export function listWordsQuery(listId: string) {
  return query(collection(db, 'lists', listId, 'words'), orderBy('createdAt', 'desc'));
}

export async function getWord(listId: string, wordId: string): Promise<WordDoc | null> {
  const snap = await getDoc(doc(db, 'lists', listId, 'words', wordId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as WordDoc) : null;
}

export async function addWord(params: {
  listIds: string[];
  terms: Record<string, string>;
  notes: string;
  createdBy: string;
}): Promise<string> {
  const groupId = Crypto.randomUUID();
  for (const listId of params.listIds) {
    await addDoc(collection(db, 'lists', listId, 'words'), {
      groupId,
      terms: params.terms,
      notes: params.notes,
      createdBy: params.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: params.createdBy,
    });
    await bumpWordCount(listId, 1);
  }
  return groupId;
}

export async function updateWord(params: {
  listId: string;
  wordId: string;
  terms: Record<string, string>;
  notes: string;
  updatedBy: string;
}): Promise<void> {
  // Last-write-wins: no conflict resolution in v1.
  await updateDoc(doc(db, 'lists', params.listId, 'words', params.wordId), {
    terms: params.terms,
    notes: params.notes,
    updatedAt: serverTimestamp(),
    updatedBy: params.updatedBy,
  });
}

export async function deleteWord(listId: string, wordId: string): Promise<void> {
  await deleteDoc(doc(db, 'lists', listId, 'words', wordId));
  await bumpWordCount(listId, -1);
}
```

### Task 5.2: Realtime words hook

**Files:**
- Create: `src/hooks/use-list-words.ts`

- [ ] **Step 1:** Implement `src/hooks/use-list-words.ts`:

```ts
import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { listWordsQuery } from '../data/words';
import { WordDoc } from '../firebase/schema';

export function useListWords(listId: string | undefined) {
  const [words, setWords] = useState<WordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) return;
    const unsub = onSnapshot(listWordsQuery(listId), (snap) => {
      setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WordDoc));
      setLoading(false);
    });
    return unsub;
  }, [listId]);

  return { words, loading };
}
```

### Task 5.3: Translate service (calls the Cloud Function)

**Files:**
- Create: `src/services/translate.ts`

- [ ] **Step 1:** Implement `src/services/translate.ts` using Firebase callable functions:

```ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

interface TranslateResult {
  translatedText: string;
}

const functions = getFunctions(app);

export async function translate(params: {
  text: string;
  source: string;
  target: string;
}): Promise<string> {
  const callable = httpsCallable<typeof params, TranslateResult>(functions, 'translate');
  const res = await callable(params);
  return res.data.translatedText;
}
```

> Add `firebase/functions` is part of the `firebase` package already installed; no new dependency.

### Task 5.4: Add-word screen with auto-translate

**Files:**
- Create: `app/(app)/words/new.tsx`

- [ ] **Step 1:** Create `app/(app)/words/new.tsx`. User types either side; a "Translate" action fills the other; both editable before saving:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLanguageName } from '../../../src/domain/languages';
import { translate } from '../../../src/services/translate';
import { addWord } from '../../../src/data/words';
import { useProfile } from '../../../src/store/session';

export default function NewWord() {
  const { listId, langA, langB } = useLocalSearchParams<{ listId: string; langA: string; langB: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  // Route params are typed as string but can be missing at runtime; guard once
  // so the rest of the component (and its closures) sees them as defined.
  if (!listId || !langA || !langB) {
    return <View style={styles.container}><Text>Missing list context.</Text></View>;
  }

  async function autoTranslate(from: 'A' | 'B') {
    setBusy(true);
    try {
      if (from === 'A' && a.trim()) {
        setB(await translate({ text: a.trim(), source: langA, target: langB }));
      } else if (from === 'B' && b.trim()) {
        setA(await translate({ text: b.trim(), source: langB, target: langA }));
      }
    } catch {
      Alert.alert('Translation failed', 'You can still type it manually.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!a.trim() || !b.trim()) return;
    await addWord({
      listIds: [listId],
      terms: { [langA]: a.trim(), [langB]: b.trim() },
      notes: notes.trim(),
      createdBy: profile.uid,
    });
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getLanguageName(langA)}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={a} onChangeText={setA} autoFocus />
        <Button title="→" onPress={() => autoTranslate('A')} />
      </View>

      <Text style={styles.label}>{getLanguageName(langB)}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={b} onChangeText={setB} />
        <Button title="←" onPress={() => autoTranslate('B')} />
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline />

      {busy && <ActivityIndicator />}
      <Button title="Save word" onPress={save} disabled={!a.trim() || !b.trim() || busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
});
```

### Task 5.5: List detail screen (view words, add, open editor)

**Files:**
- Create: `app/(app)/lists/[listId].tsx`, `app/(app)/words/[wordId].tsx`

- [ ] **Step 1:** Create `app/(app)/lists/[listId].tsx`:

```tsx
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';
import { ListDoc } from '../../../src/firebase/schema';
import { useListWords } from '../../../src/hooks/use-list-words';

export default function ListDetail() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const { words } = useListWords(listId);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) =>
      setList(s.exists() ? ({ id: s.id, ...s.data() } as ListDoc) : null)
    );
  }, [listId]);

  if (!list) return <View style={styles.container}><Text>Loading…</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{list.name}</Text>
        <Pressable onPress={() => router.push(`/(app)/lists/${listId}/members`)}>
          <Text style={styles.link}>Members ({list.memberUids.length})</Text>
        </Pressable>
      </View>

      <FlatList
        data={words}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.word}
            onPress={() => router.push(`/(app)/words/${item.id}?listId=${listId}`)}
          >
            <Text style={styles.termA}>{item.terms[list.langA]}</Text>
            <Text style={styles.termB}>{item.terms[list.langB]}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No words yet.</Text>}
      />

      <Pressable
        style={styles.fab}
        onPress={() =>
          router.push(`/(app)/words/new?listId=${listId}&langA=${list.langA}&langB=${list.langB}`)
        }
      >
        <Text style={styles.fabText}>+ Add word</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  link: { color: '#1a73e8' },
  word: { padding: 14, borderRadius: 10, backgroundColor: '#f3f4f6', marginBottom: 8 },
  termA: { fontSize: 16, fontWeight: '600' },
  termB: { fontSize: 16, color: '#374151' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  fab: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: 'white', fontWeight: '700' },
});
```

- [ ] **Step 2:** Create `app/(app)/words/[wordId].tsx` (edit — anyone in list can edit both sides; last-write-wins):

```tsx
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';
import { ListDoc, WordDoc } from '../../../src/firebase/schema';
import { getWord, updateWord, deleteWord } from '../../../src/data/words';
import { getLanguageName } from '../../../src/domain/languages';
import { useProfile } from '../../../src/store/session';

export default function EditWord() {
  const { wordId, listId } = useLocalSearchParams<{ wordId: string; listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const [word, setWord] = useState<WordDoc | null>(null);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  useEffect(() => {
    (async () => {
      if (!listId || !wordId) return;
      const w = await getWord(listId, wordId);
      if (w && list) {
        setWord(w);
        setA(w.terms[list.langA] ?? '');
        setB(w.terms[list.langB] ?? '');
        setNotes(w.notes ?? '');
      }
    })();
  }, [listId, wordId, list?.id]);

  if (!listId || !wordId || !list || !word) {
    return <View style={styles.container}><Text>Loading…</Text></View>;
  }

  // Capture the narrowed list so the closures below keep a non-null type
  // (TypeScript does not preserve narrowing of state vars inside nested functions).
  const currentList = list;

  async function save() {
    await updateWord({
      listId,
      wordId,
      terms: { [currentList.langA]: a.trim(), [currentList.langB]: b.trim() },
      notes: notes.trim(),
      updatedBy: profile.uid,
    });
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Delete word', 'Remove this word from the list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteWord(listId, wordId); router.back(); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getLanguageName(list.langA)}</Text>
      <TextInput style={styles.input} value={a} onChangeText={setA} />
      <Text style={styles.label}>{getLanguageName(list.langB)}</Text>
      <TextInput style={styles.input} value={b} onChangeText={setB} />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline />
      <Button title="Save" onPress={save} disabled={!a.trim() || !b.trim()} />
      <View style={{ height: 8 }} />
      <Button title="Delete" color="#dc2626" onPress={confirmDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
});
```

- [ ] **Step 3:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M6 — Invites & membership management

### Task 6.1: Invites data layer

**Files:**
- Create: `src/data/invites.ts`

- [ ] **Step 1:** Implement `src/data/invites.ts`. The invite `code` is the document id for O(1) lookup:

```ts
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateInviteCode, isValidInviteFormat, normalizeInviteCode } from '../domain/invite-code';
import { checkInvite, InviteError } from '../domain/invite';
import { nowMs } from '../domain/clock';
import { InviteDoc, UserDoc } from '../firebase/schema';
import { addMember } from './lists';

const SEVEN_DAYS_MS = 7 * 86400000;

export async function createInvite(listId: string, createdBy: string): Promise<string> {
  // retry until an unused code id is found
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const ref = doc(db, 'invites', code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;
    await setDoc(ref, {
      code,
      listId,
      createdBy,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(nowMs() + SEVEN_DAYS_MS),
      maxUses: 10,
      uses: 0,
      active: true,
    });
    return code;
  }
  throw new Error('Could not allocate invite code, try again.');
}

export type AcceptResult =
  | { ok: true; listId: string }
  | { ok: false; reason: InviteError };

async function isAlreadyMember(listId: string, uid: string): Promise<boolean> {
  const listSnap = await getDoc(doc(db, 'lists', listId));
  if (!listSnap.exists()) return false;
  return (listSnap.data().memberUids as string[]).includes(uid);
}

export async function acceptInvite(rawCode: string, user: UserDoc): Promise<AcceptResult> {
  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteFormat(code)) return { ok: false, reason: 'invalid' };

  const ref = doc(db, 'invites', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: 'invalid' };

  const invite = snap.data() as InviteDoc;
  const problem = checkInvite(invite, nowMs());
  if (problem) return { ok: false, reason: problem };
  if (await isAlreadyMember(invite.listId, user.uid)) {
    return { ok: false, reason: 'already-member' };
  }

  await addMember(invite.listId, user);
  await updateDoc(ref, { uses: increment(1) });
  return { ok: true, listId: invite.listId };
}
```

> **`checkInvite` lives in `src/domain/invite.ts` (pure), not here.** It must not import `firebase/config`, because a unit test importing this data module would pull in Firebase's ESM (which Jest's `jest-expo` preset does not transform) and fail to parse. Keeping it in the dependency-free domain layer also matches the standards. Create `src/domain/invite.ts`:
>
> ```ts
> export type InviteError = 'invalid' | 'expired' | 'exhausted' | 'already-member';
>
> // `expiresAt` is typed structurally (anything with toMillis(), which a Firestore
> // Timestamp satisfies) so this module stays pure — no Firebase import.
> export interface InviteLimits {
>   active: boolean;
>   uses: number;
>   maxUses: number;
>   expiresAt: { toMillis(): number };
> }
>
> export function checkInvite(invite: InviteLimits, atMs: number): InviteError | null {
>   if (!invite.active) return 'expired';
>   if (invite.expiresAt.toMillis() < atMs) return 'expired';
>   if (invite.uses >= invite.maxUses) return 'exhausted';
>   return null;
> }
> ```
>
> With a pure test `src/domain/__tests__/invite.test.ts` (no Firebase import — `expiresAt` is a plain object):
>
> ```ts
> import { checkInvite, InviteLimits } from '../invite';
>
> const base: InviteLimits = { active: true, uses: 0, maxUses: 10, expiresAt: { toMillis: () => 2_000 } };
>
> test('valid invite returns null', () => {
>   expect(checkInvite(base, 1_000)).toBeNull();
> });
> test('expired invite', () => {
>   expect(checkInvite({ ...base, expiresAt: { toMillis: () => 500 } }, 1_000)).toBe('expired');
> });
> test('exhausted invite', () => {
>   expect(checkInvite({ ...base, uses: 10 }, 1_000)).toBe('exhausted');
> });
> test('inactive invite is treated as expired', () => {
>   expect(checkInvite({ ...base, active: false }, 1_000)).toBe('expired');
> });
> ```
> No `any` anywhere — the `InviteLimits` type makes the fixture fully typed.

### Task 6.2: Members screen (invite + manage)

**Files:**
- Create: `app/(app)/lists/[listId]/members.tsx`, `app/(app)/join.tsx`

- [ ] **Step 1:** Create `app/(app)/lists/[listId]/members.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Share, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../src/firebase/config';
import { ListDoc } from '../../../../src/firebase/schema';
import { createInvite } from '../../../../src/data/invites';
import { removeMember } from '../../../../src/data/lists';
import { useProfile } from '../../../../src/store/session';
import { getLanguageName } from '../../../../src/domain/languages';

export default function Members() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const [list, setList] = useState<ListDoc | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  if (!listId || !list) return <View style={styles.container}><Text>Loading…</Text></View>;
  const isOwner = list.ownerUid === profile.uid;
  // Capture the narrowed list so the closure keeps a non-null type.
  const currentList = list;

  async function invite() {
    const c = await createInvite(listId, profile.uid);
    setCode(c);
    await Share.share({ message: `Join my PenPal list "${currentList.name}" with code ${c}` });
  }

  return (
    <View style={styles.container}>
      <Button title="Invite someone" onPress={invite} />
      {code && <Text style={styles.code}>Code: {code}</Text>}
      <FlatList
        data={list.memberUids}
        keyExtractor={(uid) => uid}
        renderItem={({ item: uid }) => {
          const m = list.members[uid];
          return (
            <View style={styles.member}>
              <Text style={styles.memberName}>
                {m?.displayName ?? uid} {uid === list.ownerUid ? '· owner' : ''}
              </Text>
              <Text style={styles.memberMeta}>
                {getLanguageName(m?.nativeLang ?? '')} → {getLanguageName(m?.targetLang ?? '')}
              </Text>
              {isOwner && uid !== profile.uid && (
                <Pressable onPress={() => removeMember(listId, uid)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  code: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 2 },
  member: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, marginBottom: 8 },
  memberName: { fontWeight: '600' },
  memberMeta: { color: '#6b7280' },
  remove: { color: '#dc2626', marginTop: 6 },
});
```

- [ ] **Step 2:** Create `app/(app)/join.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { acceptInvite } from '../../src/data/invites';
import { useProfile } from '../../src/store/session';

const MESSAGES: Record<string, string> = {
  invalid: 'That code is not valid.',
  expired: 'That invite has expired.',
  exhausted: 'That invite has been used too many times.',
  'already-member': 'You are already in this list.',
};

export default function Join() {
  const profile = useProfile();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function join() {
    setError('');
    const res = await acceptInvite(code, profile);
    if (res.ok) router.replace(`/(app)/lists/${res.listId}`);
    else setError(MESSAGES[res.reason]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter invite code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="PNK-7Q2"
        autoCapitalize="characters"
        autoFocus
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button title="Join list" onPress={join} disabled={!code.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 20, letterSpacing: 2, textAlign: 'center' },
  error: { color: '#dc2626' },
});
```

- [ ] **Step 3:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M7 — Study engine & modes

### Task 7.1: Progress data layer (per-user, per-direction)

**Files:**
- Create: `src/data/progress.ts`

- [ ] **Step 1:** Implement `src/data/progress.ts`. Study state lives under the user, keyed by `groupId`:

```ts
import {
  collection, doc, getDoc, setDoc, query, where, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { StudyDoc } from '../firebase/schema';
import { SrsState, initialSrs, schedule } from '../domain/srs';
import { nowMs } from '../domain/clock';

function studyRef(uid: string, groupId: string) {
  return doc(db, 'users', uid, 'study', groupId);
}

export async function getStudy(uid: string, groupId: string): Promise<StudyDoc | null> {
  const snap = await getDoc(studyRef(uid, groupId));
  return snap.exists() ? (snap.data() as StudyDoc) : null;
}

/** Ensure a study record exists for this word in the user's direction. */
export async function ensureStudy(params: {
  uid: string;
  groupId: string;
  prompt: string;
  answer: string;
  sourceListId: string;
}): Promise<void> {
  const ref = studyRef(params.uid, params.groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const s = initialSrs(nowMs());
  await setDoc(ref, {
    groupId: params.groupId,
    ease: s.ease,
    intervalDays: s.intervalDays,
    repetitions: s.repetitions,
    dueAt: Timestamp.fromMillis(s.dueAt),
    lastGrade: s.lastGrade,
    lastReviewedAt: Timestamp.fromMillis(0),
    prompt: params.prompt,
    answer: params.answer,
    sourceListId: params.sourceListId,
  } satisfies StudyDoc);
}

/** Apply a grade (0..5) to a study record and persist the new SM-2 state. */
export async function gradeStudy(uid: string, groupId: string, grade: number): Promise<void> {
  const ref = studyRef(uid, groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data() as StudyDoc;
  const prev: SrsState = {
    ease: d.ease,
    intervalDays: d.intervalDays,
    repetitions: d.repetitions,
    dueAt: d.dueAt.toMillis(),
    lastGrade: d.lastGrade,
    lastReviewedAt: d.lastReviewedAt.toMillis(),
  };
  const next = schedule(prev, grade, nowMs());
  await setDoc(ref, {
    ...d,
    ease: next.ease,
    intervalDays: next.intervalDays,
    repetitions: next.repetitions,
    dueAt: Timestamp.fromMillis(next.dueAt),
    lastGrade: next.lastGrade,
    lastReviewedAt: Timestamp.fromMillis(next.lastReviewedAt),
  });
}

export async function getDueStudies(uid: string, now: number, max = 50): Promise<StudyDoc[]> {
  const q = query(
    collection(db, 'users', uid, 'study'),
    where('dueAt', '<=', Timestamp.fromMillis(now))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as StudyDoc).slice(0, max);
}
```

### Task 7.2: Seed study records when entering a study session

**Files:**
- Create: `src/hooks/use-due-cards.ts`

- [ ] **Step 1:** Implement `src/hooks/use-due-cards.ts`. It walks a list's words, ensures each has a study record in the user's direction, then returns due cards:

```ts
import { useEffect, useState } from 'react';
import { getDocs } from 'firebase/firestore';
import { listWordsQuery } from '../data/words';
import { ensureStudy, getDueStudies } from '../data/progress';
import { buildPromptAnswer } from '../domain/direction';
import { nowMs } from '../domain/clock';
import { Card } from '../domain/quiz';
import { WordDoc, UserDoc } from '../firebase/schema';
import { useProfile } from '../store/session';

/** Make sure every word in the list has a study record in this user's direction. */
async function seedStudyRecords(listId: string, profile: UserDoc): Promise<void> {
  const wordsSnap = await getDocs(listWordsQuery(listId));
  for (const d of wordsSnap.docs) {
    const w = d.data() as WordDoc;
    const pa = buildPromptAnswer(w.terms, profile.nativeLang, profile.targetLang);
    if (!pa) continue; // word lacks the user's language pair
    await ensureStudy({
      uid: profile.uid,
      groupId: w.groupId,
      prompt: pa.prompt,
      answer: pa.answer,
      sourceListId: listId,
    });
  }
}

export function useDueCards(listId: string | undefined) {
  const profile = useProfile();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) return;
    let active = true;
    (async () => {
      setLoading(true);
      await seedStudyRecords(listId, profile);
      const due = await getDueStudies(profile.uid, nowMs());
      if (!active) return;
      setCards(due.map((s) => ({ groupId: s.groupId, prompt: s.prompt, answer: s.answer })));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listId, profile?.uid]);

  return { cards, loading };
}
```

### Task 7.3: Record a study day (streak + trade) on session completion

**Files:**
- Create: `src/data/stats.ts`

- [ ] **Step 1:** Implement `src/data/stats.ts`:

```ts
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserDoc } from '../firebase/schema';
import { applyStudyDay } from '../domain/streak';
import { todayKey } from '../domain/clock';

export async function recordStudyDay(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const user = snap.data() as UserDoc;
  const next = applyStudyDay(user.streak, todayKey());
  await updateDoc(ref, { streak: next });
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('_');
}

/** Increment the trade counter: `contributorUid` taught `partnerUid` a word. */
export async function recordTrade(contributorUid: string, partnerUid: string): Promise<void> {
  const key = pairKey(contributorUid, partnerUid);
  const ref = doc(db, 'trades', key);
  await setDoc(
    ref,
    { pairKey: key, counts: { [contributorUid]: increment(1) }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
```

### Task 7.4: Flashcards screen

**Files:**
- Create: `app/(app)/study/index.tsx`, `app/(app)/study/flashcards.tsx`

- [ ] **Step 1:** Create the study hub `app/(app)/study/index.tsx`:

```tsx
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';

const MODES = [
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'multiple-choice', label: 'Multiple choice' },
  { key: 'typing', label: 'Typing' },
  { key: 'matching', label: 'Matching' },
];

export default function StudyHub() {
  const profile = useProfile();
  const { lists } = useUserLists(profile?.uid);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.h}>Pick a list, then a mode</Text>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <View style={styles.listBlock}>
            <Text style={styles.listName}>{item.name}</Text>
            <View style={styles.modes}>
              {MODES.map((m) => (
                <Pressable
                  key={m.key}
                  style={styles.mode}
                  onPress={() => router.push(`/(app)/study/${m.key}?listId=${item.id}`)}
                >
                  <Text style={styles.modeText}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  h: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  listBlock: { marginBottom: 20 },
  listName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: { backgroundColor: '#e0ecff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  modeText: { color: '#1a4ed8', fontWeight: '600' },
});
```

- [ ] **Step 2:** Create `app/(app)/study/flashcards.tsx`. Self-grade flip card feeds SM-2 + records the study day:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function Flashcards() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!loading && cards.length === 0) return;
  }, [loading, cards.length]);

  if (loading) return <Center><ActivityIndicator /></Center>;
  if (cards.length === 0) return <Center><Text style={styles.done}>Nothing due. 🎉</Text></Center>;
  if (i >= cards.length) {
    recordStudyDay(profile.uid);
    return <Center><Text style={styles.done}>Session complete! 🎉</Text></Center>;
  }

  const card = cards[i];

  async function grade(g: number) {
    await gradeStudy(profile.uid, card.groupId, g);
    setFlipped(false);
    setI((n) => n + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{i + 1} / {cards.length}</Text>
      <Pressable style={styles.card} onPress={() => setFlipped((f) => !f)}>
        <Text style={styles.term}>{flipped ? card.answer : card.prompt}</Text>
        <Text style={styles.hint}>{flipped ? 'answer' : 'tap to flip'}</Text>
      </Pressable>
      {flipped && (
        <View style={styles.grades}>
          <GradeBtn label="Again" color="#dc2626" onPress={() => grade(1)} />
          <GradeBtn label="Hard" color="#d97706" onPress={() => grade(3)} />
          <GradeBtn label="Good" color="#16a34a" onPress={() => grade(4)} />
          <GradeBtn label="Easy" color="#0284c7" onPress={() => grade(5)} />
        </View>
      )}
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>{children}</View>;
}
function GradeBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.grade, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.gradeText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  progress: { textAlign: 'center', color: '#6b7280', marginBottom: 12 },
  card: { flex: 1, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  term: { fontSize: 36, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16 },
  hint: { marginTop: 12, color: '#9ca3af' },
  grades: { flexDirection: 'row', gap: 8, marginTop: 16 },
  grade: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  gradeText: { color: 'white', fontWeight: '700' },
  done: { fontSize: 22, fontWeight: '700' },
});
```

### Task 7.5: Multiple-choice screen

**Files:**
- Create: `app/(app)/study/multiple-choice.tsx`

- [ ] **Step 1:** Create `app/(app)/study/multiple-choice.tsx`. Uses `buildMultipleChoice` from Task 2.6; a correct pick grades 4, wrong grades 1:

```tsx
import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { buildMultipleChoice } from '../../../src/domain/quiz';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function MultipleChoice() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const question = useMemo(
    () => (cards.length && i < cards.length ? buildMultipleChoice(cards[i], cards, 4) : null),
    [cards, i]
  );

  if (loading) return <View style={styles.c}><ActivityIndicator /></View>;
  if (cards.length === 0) return <View style={styles.c}><Text style={styles.done}>Nothing due. 🎉</Text></View>;
  if (i >= cards.length) { recordStudyDay(profile.uid); return <View style={styles.c}><Text style={styles.done}>Done! 🎉</Text></View>; }
  if (!question) return null;
  // Capture the narrowed question so the closure keeps a non-null type.
  const q = question;

  async function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.correct;
    await gradeStudy(profile.uid, q.card.groupId, correct ? 4 : 1);
    setTimeout(() => { setPicked(null); setI((n) => n + 1); }, 700);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{i + 1} / {cards.length}</Text>
      <Text style={styles.prompt}>{question.card.prompt}</Text>
      <View style={styles.options}>
        {question.options.map((opt) => {
          const isCorrect = picked && opt === question.correct;
          const isWrongPick = picked === opt && opt !== question.correct;
          return (
            <Pressable
              key={opt}
              style={[styles.option, isCorrect && styles.correct, isWrongPick && styles.wrong]}
              onPress={() => pick(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progress: { textAlign: 'center', color: '#6b7280', marginBottom: 12 },
  prompt: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginVertical: 32 },
  options: { gap: 12 },
  option: { padding: 18, borderRadius: 12, backgroundColor: '#f3f4f6' },
  optionText: { fontSize: 18, textAlign: 'center' },
  correct: { backgroundColor: '#bbf7d0' },
  wrong: { backgroundColor: '#fecaca' },
  done: { fontSize: 22, fontWeight: '700' },
});
```

### Task 7.6: Typing screen

**Files:**
- Create: `app/(app)/study/typing.tsx`

- [ ] **Step 1:** Create `app/(app)/study/typing.tsx`. Uses `isAcceptable` from Task 2.3:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { isAcceptable } from '../../../src/domain/answer-match';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function Typing() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  if (loading) return <View style={styles.c}><ActivityIndicator /></View>;
  if (cards.length === 0) return <View style={styles.c}><Text style={styles.done}>Nothing due. 🎉</Text></View>;
  if (i >= cards.length) { recordStudyDay(profile.uid); return <View style={styles.c}><Text style={styles.done}>Done! 🎉</Text></View>; }

  const card = cards[i];

  async function check() {
    const ok = isAcceptable(card.answer, input);
    setResult(ok ? 'correct' : 'wrong');
    await gradeStudy(profile.uid, card.groupId, ok ? 4 : 1);
  }
  function next() {
    setInput('');
    setResult(null);
    setI((n) => n + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{i + 1} / {cards.length}</Text>
      <Text style={styles.prompt}>{card.prompt}</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        editable={result === null}
        placeholder="Type the translation"
        autoFocus
      />
      {result === null ? (
        <Button title="Check" onPress={check} disabled={!input.trim()} />
      ) : (
        <View>
          <Text style={[styles.feedback, result === 'correct' ? styles.ok : styles.bad]}>
            {result === 'correct' ? 'Correct!' : `Answer: ${card.answer}`}
          </Text>
          <Button title="Next" onPress={next} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progress: { textAlign: 'center', color: '#6b7280', marginBottom: 12 },
  prompt: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginVertical: 32 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 16, fontSize: 20, textAlign: 'center', marginBottom: 16 },
  feedback: { fontSize: 20, textAlign: 'center', marginBottom: 12 },
  ok: { color: '#16a34a' },
  bad: { color: '#dc2626' },
  done: { fontSize: 22, fontWeight: '700' },
});
```

### Task 7.7: Matching game screen

**Files:**
- Create: `app/(app)/study/matching.tsx`

- [ ] **Step 1:** Create `app/(app)/study/matching.tsx`. Uses `buildMatchingRound` from Task 2.6; timed; matched pairs grade 4:

```tsx
import { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { buildMatchingRound } from '../../../src/domain/quiz';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function Matching() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const round = useMemo(() => (cards.length ? buildMatchingRound(cards, 5) : null), [cards]);

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <View style={styles.c}><ActivityIndicator /></View>;
  if (!round || cards.length === 0) return <View style={styles.c}><Text style={styles.done}>Nothing due. 🎉</Text></View>;

  const allMatched = matched.size === round.prompts.length;
  if (allMatched) {
    recordStudyDay(profile.uid);
    return <View style={styles.c}><Text style={styles.done}>Matched all in {seconds}s! 🎉</Text></View>;
  }

  async function tapAnswer(groupId: string) {
    if (!selectedPrompt) return;
    if (selectedPrompt === groupId) {
      const m = new Set(matched);
      m.add(groupId);
      setMatched(m);
      await gradeStudy(profile.uid, groupId, 4);
    }
    setSelectedPrompt(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{seconds}s</Text>
      <View style={styles.cols}>
        <View style={styles.col}>
          {round.prompts.map((p) => (
            <Pressable
              key={p.groupId}
              disabled={matched.has(p.groupId)}
              style={[styles.tile, selectedPrompt === p.groupId && styles.sel, matched.has(p.groupId) && styles.gone]}
              onPress={() => setSelectedPrompt(p.groupId)}
            >
              <Text>{p.prompt}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.col}>
          {round.answers.map((a) => (
            <Pressable
              key={a.groupId}
              disabled={matched.has(a.groupId)}
              style={[styles.tile, matched.has(a.groupId) && styles.gone]}
              onPress={() => tapAnswer(a.groupId)}
            >
              <Text>{a.answer}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timer: { textAlign: 'center', fontSize: 18, marginBottom: 12, color: '#6b7280' },
  cols: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 8 },
  tile: { padding: 16, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  sel: { backgroundColor: '#bfdbfe' },
  gone: { opacity: 0.25 },
  done: { fontSize: 22, fontWeight: '700' },
});
```

- [ ] **Step 2:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M8 — Cloud Functions (translation proxy + partner nudges)

### Task 8.1: Functions package scaffolding

**Files:**
- Create: `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`

- [ ] **Step 1:** Create `functions/package.json`:

```json
{
  "name": "penpal-functions",
  "main": "lib/index.js",
  "engines": { "node": "20" },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2:** Create `functions/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "outDir": "lib",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3:** Create `functions/jest.config.js`:

```js
module.exports = { preset: 'ts-jest', testEnvironment: 'node', testMatch: ['**/test/**/*.test.ts'] };
```

- [ ] **Step 4:** Install:

```bash
npm --prefix functions install
```

### Task 8.2: Translate function (Google Cloud Translation v2 proxy)

**Files:**
- Create: `functions/src/translate.ts`, `functions/test/translate.test.ts`

- [ ] **Step 1: Write the failing test** `functions/test/translate.test.ts` (test the pure request builder + response parser, not the network call):

```ts
import { buildTranslateUrl, parseTranslateResponse } from '../src/translate';

test('builds the v2 endpoint url with encoded params', () => {
  const url = buildTranslateUrl({ text: 'หมา', source: 'th', target: 'en', apiKey: 'KEY' });
  expect(url).toContain('https://translation.googleapis.com/language/translate/v2');
  expect(url).toContain('key=KEY');
  expect(url).toContain('source=th');
  expect(url).toContain('target=en');
  expect(url).toContain(encodeURIComponent('หมา'));
});

test('parses translatedText out of the API response', () => {
  const body = { data: { translations: [{ translatedText: 'dog' }] } };
  expect(parseTranslateResponse(body)).toBe('dog');
});

test('throws on malformed response', () => {
  expect(() => parseTranslateResponse({ data: {} })).toThrow();
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm --prefix functions test -- translate`

- [ ] **Step 3: Implement** `functions/src/translate.ts`:

```ts
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const GOOGLE_TRANSLATE_API_KEY = defineSecret('GOOGLE_TRANSLATE_API_KEY');

export interface TranslateParams {
  text: string;
  source: string;
  target: string;
}

interface TranslateUrlParams extends TranslateParams {
  apiKey: string;
}

/** Shape of the subset of the Google Translate v2 response we read. */
interface TranslateApiResponse {
  data?: { translations?: Array<{ translatedText?: string }> };
}

export function buildTranslateUrl(p: TranslateUrlParams): string {
  const base = 'https://translation.googleapis.com/language/translate/v2';
  const params = new URLSearchParams({
    key: p.apiKey,
    q: p.text,
    source: p.source,
    target: p.target,
    format: 'text',
  });
  return `${base}?${params.toString()}`;
}

export function parseTranslateResponse(body: TranslateApiResponse): string {
  const t = body?.data?.translations?.[0]?.translatedText;
  if (typeof t !== 'string') throw new Error('Malformed translation response');
  return t;
}

function readParams(data: Partial<TranslateParams> | undefined): TranslateParams {
  const text = data?.text;
  const source = data?.source;
  const target = data?.target;
  if (!text || !source || !target) {
    throw new HttpsError('invalid-argument', 'text, source, target required.');
  }
  return { text, source, target };
}

export const translate = onCall(
  { secrets: [GOOGLE_TRANSLATE_API_KEY], region: 'us-central1' },
  async (request: CallableRequest<Partial<TranslateParams>>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const { text, source, target } = readParams(request.data);

    const url = buildTranslateUrl({ text, source, target, apiKey: GOOGLE_TRANSLATE_API_KEY.value() });
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new HttpsError('internal', `Translate API error: ${res.status}`);
    const body = (await res.json()) as TranslateApiResponse;
    return { translatedText: parseTranslateResponse(body) };
  }
);
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm --prefix functions test -- translate` → all pass.

### Task 8.3: Expo push helper

**Files:**
- Create: `functions/src/expo-push.ts`, `functions/test/expo-push.test.ts`

- [ ] **Step 1: Write the failing test** `functions/test/expo-push.test.ts`:

```ts
import { buildExpoMessages } from '../src/expo-push';

test('builds one message per token with title and body', () => {
  const msgs = buildExpoMessages(['ExponentPushToken[a]', 'ExponentPushToken[b]'], 'Title', 'Body', { listId: 'L1' });
  expect(msgs).toHaveLength(2);
  expect(msgs[0]).toMatchObject({ to: 'ExponentPushToken[a]', title: 'Title', body: 'Body', data: { listId: 'L1' } });
});

test('filters out invalid tokens', () => {
  const msgs = buildExpoMessages(['bad', 'ExponentPushToken[ok]'], 'T', 'B', {});
  expect(msgs).toHaveLength(1);
  expect(msgs[0].to).toBe('ExponentPushToken[ok]');
});
```

- [ ] **Step 2: Run it (expect FAIL).** Run: `npm --prefix functions test -- expo-push`

- [ ] **Step 3: Implement** `functions/src/expo-push.ts`:

```ts
export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
}

export function isExpoToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token);
}

export function buildExpoMessages(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>
): ExpoMessage[] {
  return tokens
    .filter(isExpoToken)
    .map((to) => ({ to, title, body, data, sound: 'default' }));
}

export async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}
```

- [ ] **Step 4: Run it (expect PASS).** Run: `npm --prefix functions test -- expo-push` → all pass.

### Task 8.4: Partner-nudge trigger on word creation

**Files:**
- Create: `functions/src/on-word-created.ts`, `functions/src/index.ts`

- [ ] **Step 1:** Implement `functions/src/on-word-created.ts`. When a word is added to a list, notify the *other* members (not the author) and bump the trade counter:

```ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { buildExpoMessages, sendExpoPush } from './expo-push';

if (admin.apps.length === 0) admin.initializeApp();

// Minimal shapes of the docs this trigger reads (typed to avoid `any`).
interface WordData {
  createdBy: string;
  terms: Record<string, string>;
}
interface MemberInfo {
  displayName: string;
}
interface ListData {
  name: string;
  memberUids: string[];
  members?: Record<string, MemberInfo>;
}
interface UserData {
  expoPushTokens?: string[];
}

/** Increment the word-trade counter so the author is credited for teaching `partnerUid`. */
async function bumpTrade(db: admin.firestore.Firestore, authorUid: string, partnerUid: string): Promise<void> {
  const pairKey = [authorUid, partnerUid].sort().join('_');
  await db.doc(`trades/${pairKey}`).set(
    {
      pairKey,
      counts: { [authorUid]: admin.firestore.FieldValue.increment(1) },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Collect the Expo push tokens of every member except the author, bumping each trade en route. */
async function collectTokensAndTrade(
  db: admin.firestore.Firestore,
  list: ListData,
  authorUid: string
): Promise<string[]> {
  const others = list.memberUids.filter((uid) => uid !== authorUid);
  const tokens: string[] = [];
  for (const uid of others) {
    const user = (await db.doc(`users/${uid}`).get()).data() as UserData | undefined;
    if (user?.expoPushTokens) tokens.push(...user.expoPushTokens);
    await bumpTrade(db, authorUid, uid);
  }
  return tokens;
}

function nudgeBody(list: ListData, word: WordData): string {
  const authorName = list.members?.[word.createdBy]?.displayName ?? 'Your partner';
  const firstTerm = Object.values(word.terms)[0] ?? '';
  return `${authorName} added "${firstTerm}" to ${list.name}`;
}

export const onWordCreated = onDocumentCreated(
  { document: 'lists/{listId}/words/{wordId}', region: 'us-central1' },
  async (event) => {
    const word = event.data?.data() as WordData | undefined;
    if (!word) return;

    const db = admin.firestore();
    const listSnap = await db.doc(`lists/${event.params.listId}`).get();
    const list = listSnap.data() as ListData | undefined;
    if (!list) return;

    const tokens = await collectTokensAndTrade(db, list, word.createdBy);
    const messages = buildExpoMessages(tokens, 'New word to learn', nudgeBody(list, word), {
      listId: event.params.listId,
    });
    await sendExpoPush(messages);
  }
);
```

- [ ] **Step 2:** Create `functions/src/index.ts` exporting both functions:

```ts
export { translate } from './translate';
export { onWordCreated } from './on-word-created';
```

- [ ] **Step 3:** Build the functions package to confirm it compiles:

Run: `npm --prefix functions run build`
Expected: compiles to `functions/lib` with no errors.

> The trade counter is incremented here (server-side) on word creation, so the client `recordTrade` helper from Task 7.3 is NOT called from the app — remove that responsibility from the client to avoid double-counting. Keep `recordStudyDay` on the client (Task 7.3) since it depends on local timezone.

### Task 8.5: Push-token registration on the client

**Files:**
- Create: `src/data/push.ts`, `src/services/notifications.ts`

- [ ] **Step 1:** Implement `src/data/push.ts`:

```ts
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function savePushToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { expoPushTokens: arrayUnion(token) });
}
```

- [ ] **Step 2:** Implement `src/services/notifications.ts` (push registration + local daily reminder):

```ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { savePushToken } from '../data/push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // SDK 53+ split `shouldShowAlert` into banner/list.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(uid: string): Promise<void> {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return;
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await savePushToken(uid, token);
}

/** Schedule a repeating local daily study reminder at the given hour (0-23). */
export async function scheduleDailyReminder(hour: number, minute = 0): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Time to study 📚', body: 'Keep your streak alive — review your words.' },
    // SDK 53+ requires a typed trigger; DAILY repeats at the given local time.
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
```

- [ ] **Step 3:** Install device module:

```bash
npx expo install expo-device
```

- [ ] **Step 4:** Register push on login — modify `app/_layout.tsx` to call `registerForPush` when a user with completed onboarding is present. Add this effect inside `RootLayout` after the existing effects:

```tsx
import { registerForPush } from '../src/services/notifications';
// ...inside RootLayout component body, after the navigation effect:
useEffect(() => {
  if (user && !needsOnboarding) registerForPush(user.uid);
}, [user, needsOnboarding]);
```

- [ ] **Step 5:** Typecheck.

Run: `npm run typecheck`
Expected: no errors.

---

## Milestone M9 — Stats, settings, security rules, privacy, docs

### Task 9.1: Stats hook + screen (streak, leaderboard, trade counter)

**Files:**
- Create: `src/hooks/use-stats.ts`, `app/(app)/stats.tsx`

- [ ] **Step 1:** Implement `src/hooks/use-stats.ts`:

```ts
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { TradeDoc, UserDoc } from '../firebase/schema';

export interface PartnerTrade {
  partnerUid: string;
  partnerName: string;
  iTaughtThem: number;
  theyTaughtMe: number;
}

export function useStats(profile: UserDoc | null) {
  const [trades, setTrades] = useState<PartnerTrade[]>([]);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      // trades where this user participates: query both orderings via pairKey prefix is awkward,
      // so scan trades containing this uid by checking both halves.
      const all = await getDocs(collection(db, 'trades'));
      const mine: PartnerTrade[] = [];
      for (const d of all.docs) {
        const t = d.data() as TradeDoc;
        const [a, b] = t.pairKey.split('_');
        if (a !== profile.uid && b !== profile.uid) continue;
        const partnerUid = a === profile.uid ? b : a;
        const partnerSnap = await getDoc(doc(db, 'users', partnerUid));
        mine.push({
          partnerUid,
          partnerName: (partnerSnap.data() as UserDoc | undefined)?.displayName ?? 'Partner',
          iTaughtThem: t.counts[profile.uid] ?? 0,
          theyTaughtMe: t.counts[partnerUid] ?? 0,
        });
      }
      setTrades(mine);
    })();
  }, [profile?.uid]);

  return { trades };
}
```

> Note: scanning all `trades` is fine for v1 scale. If the trades collection grows large, replace with two indexed fields `uidA`/`uidB` and two queries. Flagged as a future optimization.

- [ ] **Step 2:** Create `app/(app)/stats.tsx`:

```tsx
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useProfile } from '../../src/store/session';
import { useStats } from '../../src/hooks/use-stats';

export default function Stats() {
  const profile = useProfile();
  const { trades } = useStats(profile ?? null);

  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <Text style={styles.streakNum}>{profile?.streak.current ?? 0}🔥</Text>
        <Text style={styles.streakLabel}>day streak (best {profile?.streak.longest ?? 0})</Text>
      </View>

      <Text style={styles.h}>Word trades</Text>
      <FlatList
        data={trades}
        keyExtractor={(t) => t.partnerUid}
        renderItem={({ item }) => (
          <View style={styles.tradeRow}>
            <Text style={styles.tradeName}>{item.partnerName}</Text>
            <Text style={styles.tradeCounts}>
              You taught {item.iTaughtThem} · They taught {item.theyTaughtMe}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No shared words yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  streakCard: { padding: 24, borderRadius: 16, backgroundColor: '#fff7ed', alignItems: 'center', marginBottom: 24 },
  streakNum: { fontSize: 48, fontWeight: '800' },
  streakLabel: { color: '#9a3412' },
  h: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  tradeRow: { padding: 14, backgroundColor: '#f3f4f6', borderRadius: 10, marginBottom: 8 },
  tradeName: { fontWeight: '600' },
  tradeCounts: { color: '#6b7280', marginTop: 4 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 20 },
});
```

### Task 9.2: Settings screen (reminder time, sign out)

**Files:**
- Create: `app/(app)/settings.tsx`

- [ ] **Step 1:** Create `app/(app)/settings.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, Button, StyleSheet, Switch, Platform } from 'react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useProfile } from '../../src/store/session';
import { scheduleDailyReminder } from '../../src/services/notifications';
import { getLanguageName } from '../../src/domain/languages';
import * as Notifications from 'expo-notifications';

export default function Settings() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const [reminderOn, setReminderOn] = useState(false);

  async function toggleReminder(on: boolean) {
    setReminderOn(on);
    if (on) await scheduleDailyReminder(19); // 7pm
    else await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.row}>Signed in as {profile?.displayName}</Text>
      <Text style={styles.row}>
        Learning: {getLanguageName(profile?.nativeLang ?? '')} → {getLanguageName(profile?.targetLang ?? '')}
      </Text>

      <View style={styles.toggleRow}>
        <Text>Daily reminder (7pm)</Text>
        <Switch value={reminderOn} onValueChange={toggleReminder} />
      </View>

      <Button title="Sign out" color="#dc2626" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  row: { fontSize: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
```

### Task 9.3: Firestore security rules

**Files:**
- Create: `firestore.rules`, `firestore.indexes.json`

- [ ] **Step 1:** Create `firestore.rules`. Read/write to a list and its words require membership; study/user docs are private to the owner; invites are readable so they can be accepted:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function isMember(listId) {
      return signedIn()
        && request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.memberUids;
    }

    match /users/{uid} {
      allow read: if signedIn();                 // members need to read partner display info
      allow write: if signedIn() && request.auth.uid == uid;

      match /study/{groupId} {
        allow read, write: if signedIn() && request.auth.uid == uid;
      }
    }

    match /lists/{listId} {
      allow read: if isMember(listId);
      allow create: if signedIn() && request.resource.data.ownerUid == request.auth.uid
                    && request.auth.uid in request.resource.data.memberUids;
      // members may update (rename, membership, counters); only owner may delete
      allow update: if isMember(listId);
      allow delete: if signedIn() && resource.data.ownerUid == request.auth.uid;

      match /words/{wordId} {
        allow read, write: if isMember(listId);
      }
    }

    match /invites/{code} {
      allow read: if signedIn();                 // needed to look up & accept
      allow create: if signedIn() && request.resource.data.createdBy == request.auth.uid;
      allow update: if signedIn();               // accepting increments uses
      allow delete: if false;
    }

    match /trades/{pairKey} {
      allow read: if signedIn() && request.auth.uid in pairKey.split('_');
      allow write: if false;                      // only Cloud Functions (admin) write trades
    }
  }
}
```

- [ ] **Step 2:** Create `firestore.indexes.json` for the due-cards query (study `dueAt` range) and user-lists query:

```json
{
  "indexes": [
    {
      "collectionGroup": "study",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "dueAt", "order": "ASCENDING" }]
    }
  ],
  "fieldOverrides": []
}
```

> The `lists` array-contains query on `memberUids` and the single-field `dueAt` query are auto-indexed by Firestore; the explicit index above is a safeguard. The Firestore emulator and `firebase deploy --only firestore` will report if more composite indexes are needed.

- [ ] **Step 3:** Validate rules syntax with the emulator (optional but recommended):

```bash
npx firebase emulators:start --only firestore
```
Expected: emulator boots and loads `firestore.rules` without parse errors. Stop with Ctrl-C.

### Task 9.4: Privacy policy draft

**Files:**
- Create: `PRIVACY.md`

- [ ] **Step 1:** Create `PRIVACY.md`:

```markdown
# PenPal Privacy Policy

_Last updated: 2026-06-14_

PenPal helps people learn each other's languages by collecting and studying vocabulary together.

## What we collect
- **Account info** from Google or Apple sign-in: your name, email, and profile photo.
- **Your content**: the words, translations, lists, and study progress you create.
- **Device push token**: to send study reminders and partner notifications.

## How we use it
- To provide the app: storing your words, syncing across your devices, and showing them to members of lists you join.
- To send notifications you enable (daily reminders, partner activity).
- To translate words you add, via Google Cloud Translation. Text you choose to translate is sent to Google for that purpose.

## Sharing
- Words and lists are visible only to the members of those lists. Nothing is public or searchable.
- We do not sell your data.
- Service providers: Google Firebase (storage, auth, notifications) and Google Cloud Translation.

## Your choices
- You can sign out at any time.
- To delete your account and associated data, contact: jesse@implemented.today.

## Contact
Questions: jesse@implemented.today
```

### Task 9.5: README with operational setup

**Files:**
- Create: `README.md`

- [ ] **Step 1:** Create `README.md` capturing the manual setup steps a new developer must do (these are console actions, not code):

```markdown
# PenPal

Bilingual shared-vocabulary app for couples and small groups. React Native + Expo + Firebase.

## One-time setup

1. **Firebase project** (Blaze plan required for Cloud Functions):
   - Create a project at console.firebase.google.com, upgrade to Blaze.
   - Enable **Firestore**, **Authentication** (Google + Apple providers), and **Cloud Functions**.
   - Copy the web SDK config into a local `.env` (use `.env.example` as the template). NEVER commit `.env`.

2. **Google / Apple sign-in:**
   - In Firebase Auth, enable Google and Apple sign-in providers.
   - Create OAuth client IDs (iOS, Android, Web) in Google Cloud Console; put them in `.env`.
   - For Apple: configure Sign in with Apple in your Apple Developer account and Firebase.

3. **Google Cloud Translation:**
   - Enable the Cloud Translation API in Google Cloud Console.
   - Create an API key restricted to the Translation API.
   - Store it as a Functions secret (NOT in the app):
     `npx firebase functions:secrets:set GOOGLE_TRANSLATE_API_KEY`

4. **EAS:**
   - `npx eas init` to create a project id; put it in `.env` as `EXPO_PUBLIC_EAS_PROJECT_ID`.
   - Build a dev client: `npx eas build --profile development --platform ios` (and/or android).

## Develop

- `npm start` — Expo dev server (use the dev client build, not Expo Go, because of native auth/push).
- `npm test` — app logic tests.
- `npm run functions:test` — Cloud Functions tests.
- `npm run typecheck` — TypeScript.

## Deploy backend

- `npx firebase deploy --only firestore:rules,firestore:indexes`
- `npx firebase deploy --only functions`

## Architecture

See `plan-penpal-v1.md` for the full data model and milestone breakdown.
```

- [ ] **Step 2:** Final full check across the app:

Run: `npm run typecheck && npm test`
Expected: typecheck clean; all domain/data unit tests pass.

Run: `npm --prefix functions test && npm --prefix functions run build`
Expected: functions tests pass and compile.

---

## Self-review notes (resolved)

- **Spec coverage:** scaffolding (M0), data model + rules (M1, 9.3), auth + profile (M3), invite pairing + membership (M6), word CRUD + auto-translate (M5), list management incl. word-in-many-lists via `groupId` (M4/M5), study engine + 4 modes + per-person/per-direction progress (M2/M7), gamification streaks/leaderboard/trade counter (M2.7, 7.3, 8.4, 9.1), push reminders + partner nudges (M8), offline sync (M1 persistent cache), privacy (9.4), build ordering (M0→M9). All covered.
- **Double-counting fixed:** trade counter is written server-side in `onWordCreated` (Task 8.4); the client `recordTrade` in Task 7.3 is intentionally left unused — the note in Task 8.4 instructs removing it from client call sites. `recordStudyDay` stays client-side (needs local timezone). Rules forbid client writes to `trades` (9.3), enforcing this.
- **Type consistency:** `SrsState`, `Card`, `StreakState`, `buildPromptAnswer`, `buildMultipleChoice`, `buildMatchingRound`, `isAcceptable`, `generateInviteCode` names are used identically across producing and consuming tasks.
- **Word-in-many-lists:** v1 add-word UI writes to a single list; the data layer (`addWord` accepts `listIds[]`) and `groupId`/per-user `study` keyed by `groupId` already support multi-list membership and unified progress, so a future "add to multiple lists" picker needs only a UI change.

### Coding-standards conformance (per `CLAUDE.md`)
- **No `any`:** the only external/JSON shapes are typed — `TranslateApiResponse`/`TranslateParams` (Task 8.2) and the `WordData`/`ListData`/`UserData` interfaces in the `on-word-created` trigger (Task 8.4). Test fixtures use the narrow `InviteLimits` type, not `any`.
- **No native `Date`:** all time access goes through `src/domain/clock.ts` (Task 2.0, Luxon-backed) — `nowMs`, `todayKey`, `dayDiff`, `msFromIso`. The only millis-into-Firestore boundary is `Timestamp.fromMillis(nowMs() + …)`, allowed by the standard. (`Date.UTC` appears once in `clock.test.ts` purely as an independent oracle for the Luxon helper.)
- **No non-null assertions:** the `useProfile()` hook (Task 3.2) returns a guaranteed `UserDoc` for `(app)` screens; route params and `onSnapshot` state are narrowed with early-return guards. No `!` remains in any code block.
- **Method/file size:** longer flows are split into helpers — `checkInvite`/`isAlreadyMember` (invites), `seedStudyRecords` (due-cards), `bumpTrade`/`collectTokensAndTrade`/`nudgeBody` (trigger), `readParams` (translate) — each well under ~30 lines; all files stay well under ~300 lines.
- **kebab-case filenames:** every `src/` and `functions/src/` file is kebab-case (e.g. `answer-match.ts`, `invite-code.ts`, `use-auth.ts`, `on-word-created.ts`, `expo-push.ts`, `list-card.tsx`); exported symbols (`useAuth`, `onWordCreated`, `ListCard`) keep their conventional casing. Expo Router files under `app/` keep their framework-mandated names.
- **Tests:** added a small direct `invites.test.ts` for the pure `checkInvite`; Cloud Functions keep `translate.test.ts` and `expo-push.test.ts`. All suites use the established Jest + ts-jest pattern.

## Known v1 scope boundaries (explicitly deferred)
- No romanization/audio (confirmed out of scope).
- No tags/folders.
- Single-list add-word UI (multi-list is data-ready, UI later).
- `trades` full-collection scan in stats (fine at couple/small-group scale; indexed fields later).
