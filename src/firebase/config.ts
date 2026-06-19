import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
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

// NOTE: The Firebase JS SDK only supports on-device persistence via IndexedDB, which doesn't
// exist in React Native, so we use an in-memory cache (online reads/writes work normally).
// True offline persistence would require migrating to @react-native-firebase — tracked as a
// follow-up, not needed for v1.
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

// NOTE: Auth uses in-memory persistence (the session does not survive a cold start). Wiring
// `initializeAuth` with `getReactNativePersistence(AsyncStorage)` hangs Auth initialization
// under the New Architecture (the initial onAuthStateChanged never fires), freezing the app on
// the loading gate. Persisting the session needs a different approach (e.g. migrating auth to
// @react-native-firebase) — tracked as a follow-up.
export const auth = getAuth(app);
