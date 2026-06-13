import { useEffect } from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../src/hooks/use-auth';
import { useSession } from '../src/store/session';
import { registerForPush } from '../src/services/notifications';

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

  useEffect(() => {
    if (user && !needsOnboarding) registerForPush(user.uid);
  }, [user, needsOnboarding]);

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
