import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Globe, RotateCcw, Library, ChevronLeft, LucideIcon } from 'lucide-react-native';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing } from '../../../src/ui/theme';

const GAME_LABELS: Record<string, string> = {
  flashcards: 'Flashcards',
  'multiple-choice': 'Multiple choice',
  typing: 'Typing',
  matching: 'Matching',
  listening: 'Listening',
};

export default function PlayScope() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const profile = useProfile();
  const { lists } = useUserLists(profile.uid);
  const router = useRouter();

  const game = mode ?? 'flashcards';
  const gameLabel = GAME_LABELS[game] ?? 'Play';

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        {gameLabel}
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        Choose what to study.
      </AppText>

      <AppText
        variant="label"
        color={colors.textMuted}
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      >
        PICK A LIST
      </AppText>
      {lists.length === 0 ? (
        <AppText variant="caption" color={colors.textMuted}>
          You have no lists yet.
        </AppText>
      ) : (
        <View style={{ gap: spacing.md }}>
          {lists.map((list) => (
            <ScopeRow
              key={list.id}
              icon={Library}
              accent={colors.partner}
              title={list.name}
              subtitle={`${list.wordCount} ${list.wordCount === 1 ? 'word' : 'words'}`}
              onPress={() => router.push(`/(app)/study/${game}?listId=${list.id}`)}
            />
          ))}
        </View>
      )}

      <AppText
        variant="label"
        color={colors.textMuted}
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      >
        OR STUDY EVERYTHING
      </AppText>
      <View style={{ gap: spacing.md }}>
        <ScopeRow
          icon={Globe}
          accent={colors.you}
          title="All lists"
          subtitle="Study due words across every list"
          onPress={() => router.push(`/(app)/study/${game}`)}
        />
        <ScopeRow
          icon={RotateCcw}
          accent={colors.warning}
          title="Review"
          subtitle="Practice words you've marked fully learned"
          onPress={() => router.push(`/(app)/study/${game}?mode=review`)}
        />
      </View>
    </Screen>
  );
}

function ScopeRow({
  icon,
  accent,
  title,
  subtitle,
  onPress,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
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
          <Icon icon={icon} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {subtitle}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
