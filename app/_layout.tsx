import { useEffect } from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../src/hooks/use-auth';
import { useSession } from '../src/store/session';
import { registerForPush } from '../src/services/notifications';
import { colors } from '../src/ui/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.you} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, profile, loading, needsUsername, needsOnboarding } = useAuth();
  const setProfile = useSession((s) => s.setProfile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (loading) return;
    const seg = segments as string[];
    const inAuthGroup = seg[0] === '(auth)';
    const inAppGroup = seg[0] === '(app)';

    if (!user) {
      // Signed out: get them to sign-in (unless already in the auth flow).
      if (!inAuthGroup) router.replace('/(auth)/sign-in');
      return;
    }

    // Signed in. With persisted auth, a cold start lands here on the root `index`
    // spinner before the profile has loaded — wait for it so app screens never
    // render against a null profile, then route to onboarding or the app.
    if (!profile) return;
    if (needsUsername) {
      if (seg[1] !== 'username') router.replace('/(auth)/username');
    } else if (needsOnboarding) {
      if (seg[1] !== 'onboarding') router.replace('/(auth)/onboarding');
    } else if (!inAppGroup) {
      router.replace('/(app)/home');
    }
  }, [user, profile, loading, needsUsername, needsOnboarding, segments]);

  useEffect(() => {
    if (user && !needsOnboarding) registerForPush(user.uid);
  }, [user, needsOnboarding]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.you} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}
