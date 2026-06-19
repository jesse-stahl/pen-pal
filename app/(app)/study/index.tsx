import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Layers, ListChecks, Keyboard, Shuffle, Gamepad2, LucideIcon } from 'lucide-react-native';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Icon } from '../../../src/ui/components/icon';
import { EmptyState } from '../../../src/ui/components/empty-state';
import { colors, spacing } from '../../../src/ui/theme';

const MODES: { key: string; label: string; icon: LucideIcon; accent: string }[] = [
  { key: 'flashcards', label: 'Flashcards', icon: Layers, accent: colors.you },
  { key: 'multiple-choice', label: 'Multiple choice', icon: ListChecks, accent: colors.partner },
  { key: 'typing', label: 'Typing', icon: Keyboard, accent: colors.success },
  { key: 'matching', label: 'Matching', icon: Shuffle, accent: colors.warning },
];

export default function PlayHub() {
  const profile = useProfile();
  const { lists } = useUserLists(profile.uid);
  const router = useRouter();

  return (
    <Screen scroll>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Play
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        Pick a list, then a game.
      </AppText>

      {lists.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title="No lists to play yet"
          body="Create a list and add a few words to start studying."
          actionLabel="Create a list"
          onAction={() => router.push('/(app)/lists/new')}
        />
      ) : (
        lists.map((list) => (
          <View key={list.id} style={{ marginTop: spacing.xl }}>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>
              {list.name}
            </AppText>
            <View style={{ gap: spacing.md }}>
              {MODES.map((m) => (
                <Card
                  key={m.key}
                  onPress={() => router.push(`/(app)/study/${m.key}?listId=${list.id}`)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: colors.elevated,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon icon={m.icon} color={m.accent} />
                    </View>
                    <AppText variant="bodyStrong">{m.label}</AppText>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
