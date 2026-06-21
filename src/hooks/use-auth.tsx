import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as fbSignOut,
  User,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../firebase/config';
import { createUserIfMissing, getUser } from '../data/users';
import { UserDoc } from '../firebase/schema';

// Native Google sign-in (Credential Manager on Android, native sheet on iOS). Replaces the
// expo-auth-session browser flow, which Google now rejects for Android clients ("Custom URI
// scheme is not enabled"). webClientId is the server client id used to mint the Firebase idToken.
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

async function googleIdToken(): Promise<string | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  return result.type === 'success' ? result.data.idToken : null;
}

interface AuthContextValue {
  user: User | null;
  profile: UserDoc | null;
  loading: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Single source of truth for auth state. Provided once at the app root so the gate
// (app/_layout.tsx) and every screen share one profile — otherwise a screen that
// updates the profile (e.g. onboarding saving languages) wouldn't be visible to the
// gate, which would bounce the user back.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve `loading` as soon as the auth state is known — never block the gate on a
  // Firestore read. With persisted auth, a cold start restores a user and an awaited
  // profile fetch here would freeze the whole app on the loading spinner if that read
  // stalls. Clearing user state happens here; the profile loads in the effect below.
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) setProfile(null);
    });
  }, []);

  // Lazily create + load this user's profile whenever the signed-in user changes. Runs
  // independently of `loading`, so the UI can route while the profile resolves.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      await createUserIfMissing({
        uid: user.uid,
        displayName: user.displayName ?? 'Learner',
        email: user.email,
        photoURL: user.photoURL,
      });
      const loaded = await getUser(user.uid);
      if (active) setProfile(loaded);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  async function signInWithGoogle() {
    const idToken = await googleIdToken();
    if (!idToken) return; // user cancelled
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  }

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

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    needsOnboarding: !!user && !!profile && (!profile.nativeLang || !profile.targetLang),
    signInWithGoogle,
    signInWithApple,
    signOut: () => fbSignOut(auth),
    refreshProfile: async () => {
      if (user) setProfile(await getUser(user.uid));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
