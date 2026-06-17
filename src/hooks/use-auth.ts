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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

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

  return {
    user,
    profile,
    loading,
    needsOnboarding: !!user && !!profile && (!profile.nativeLang || !profile.targetLang),
    signInWithGoogle,
    signInWithApple,
    signOut: () => fbSignOut(auth),
    refreshProfile: async () => user && setProfile(await getUser(user.uid)),
  };
}
