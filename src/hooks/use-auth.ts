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
