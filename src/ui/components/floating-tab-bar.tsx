import { ComponentProps } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Library, Gamepad2, User, LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, shadows } from '../theme';
import { AppText } from './app-text';
import { Icon } from './icon';

// Derive the tab-bar props from the Tabs component itself so we don't depend on a
// deep internal expo-router path or a separately-installed @react-navigation package.
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'home', label: 'Home', icon: Home },
  { name: 'lists/index', label: 'Lists', icon: Library },
  { name: 'study/index', label: 'Play', icon: Gamepad2 },
  { name: 'profile', label: 'Profile', icon: User },
];

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  // The Tabs navigator renders this bar for every route in the group, including
  // full-screen detail/study routes (href: null). Only show it on the 4 real tabs
  // so it never overlaps a game, the Results screen, or a screen's own CTA.
  const currentRoute = state.routes[state.index]?.name;
  if (!TABS.some((t) => t.name === currentRoute)) return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        bottom: insets.bottom + spacing.sm,
        flexDirection: 'row',
        backgroundColor: Platform.OS === 'ios' ? colors.glass : colors.elevated,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        ...shadows.floating,
      }}
    >
      {TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        const focused = state.index === routeIndex;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => navigation.navigate(tab.name)}
            style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.sm }}
          >
            <Icon icon={tab.icon} size={22} color={focused ? colors.you : colors.textMuted} />
            <AppText variant="label" color={focused ? colors.text : colors.textMuted}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
