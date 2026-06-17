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
