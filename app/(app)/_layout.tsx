import { Tabs } from 'expo-router';

export default function AppLayout() {
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
