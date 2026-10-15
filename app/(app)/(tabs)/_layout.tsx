import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../../src/ui/components/floating-tab-bar';
import { colors } from '../../../src/ui/theme';

// The 4 top-level tabs. Every other (app) route is a Stack screen pushed above
// this navigator (see app/(app)/_layout.tsx), so the tab bar hides on them and
// back always pops to the previous screen.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="lists" />
      <Tabs.Screen name="play" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
