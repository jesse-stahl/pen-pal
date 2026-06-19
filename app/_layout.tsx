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
    else if (user && !needsOnboarding && inAuthGroup) router.replace('/(app)/home');
  }, [user, loading, needsOnboarding, segments]);

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
