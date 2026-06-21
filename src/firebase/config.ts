import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// @react-native-firebase initializes the default app from the native
// google-services.json / GoogleService-Info.plist at startup. Auth session
// persistence and Firestore on-device offline persistence are both enabled by
// default — no extra wiring. This replaces the Firebase JS SDK, which on React
// Native could only do in-memory auth (signed the user out on every cold start)
// and an in-memory Firestore cache (no real offline support).
const app = getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
