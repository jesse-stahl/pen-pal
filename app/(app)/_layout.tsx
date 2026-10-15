import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../../src/store/session';
import { colors } from '../../src/ui/theme';

// Deep links into a detail route still get the tabs underneath, so back works.
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  // Don't mount app screens until the profile is in the session — they call useProfile(),
  // which throws on null. The root gate (app/_layout.tsx) handles redirecting unauthed users.
  const profile = useSession((s) => s.profile);
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.you} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  );
}
