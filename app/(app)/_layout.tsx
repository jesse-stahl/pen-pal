import { Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../../src/store/session';

export default function AppLayout() {
  // Don't mount tab screens until the profile is in the session — they call useProfile(),
  // which throws on null. The root gate (app/_layout.tsx) handles redirecting unauthed users.
  const profile = useSession((s) => s.profile);
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <Tabs>
      <Tabs.Screen name="lists/index" options={{ title: 'Lists' }} />
      <Tabs.Screen name="study/index" options={{ title: 'Study' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* hidden routes */}
      <Tabs.Screen name="lists/[listId]" options={{ href: null }} />
      <Tabs.Screen name="lists/new" options={{ href: null }} />
      <Tabs.Screen name="lists/[listId]/members" options={{ href: null }} />
      <Tabs.Screen name="words/new" options={{ href: null }} />
      <Tabs.Screen name="words/[wordId]" options={{ href: null }} />
      <Tabs.Screen name="study/flashcards" options={{ href: null }} />
      <Tabs.Screen name="study/multiple-choice" options={{ href: null }} />
      <Tabs.Screen name="study/typing" options={{ href: null }} />
      <Tabs.Screen name="study/matching" options={{ href: null }} />
      <Tabs.Screen name="join" options={{ href: null }} />
    </Tabs>
  );
}
