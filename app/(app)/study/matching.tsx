import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { buildMatchingRound } from '../../../src/domain/quiz';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';
import { useStudySession } from '../../../src/store/study-session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { StudyHeader } from '../../../src/ui/components/study-header';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function Matching() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const { cards, loading } = useDueCards(listId);
  const round = useMemo(() => (cards.length ? buildMatchingRound(cards, 5) : null), [cards]);
  const { start, log } = useStudySession();
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && round) start(round.prompts.length, 'matching', listId);
  }, [loading, round]);
  useEffect(() => {
    if (!loading && cards.length === 0) router.replace('/(app)/study/results');
  }, [loading, cards.length]);
  // Each focus starts a fresh round; this Tabs screen stays mounted between visits.
  useFocusEffect(
    useCallback(() => {
      setSelected(null);
      setMatched(new Set());
    }, []),
  );

  if (loading) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.you} />
      </Screen>
    );
  }
  if (!round || cards.length === 0) return null;
  const r = round;

  async function tapAnswer(groupId: string, answer: string) {
    if (!selected) return;
    if (selected === groupId) {
      const m = new Set(matched);
      m.add(groupId);
      setMatched(m);
      log({ prompt: '', answer, correct: true });
      await gradeStudy(profile.uid, groupId, 4);
      if (m.size === r.prompts.length) {
        await recordStudyDay(profile.uid);
        router.replace('/(app)/study/results');
      }
    }
    setSelected(null);
  }

  return (
    <Screen>
      <StudyHeader index={matched.size} total={r.prompts.length} />
      <AppText
        variant="caption"
        color={colors.textMuted}
        style={{ textAlign: 'center', marginBottom: spacing.lg }}
      >
        Match each pair
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.md, flex: 1 }}>
        <View style={{ flex: 1, gap: spacing.md }}>
          {r.prompts.map((p) => (
            <Tile
              key={p.groupId}
              text={p.prompt}
              accent={colors.you}
              selected={selected === p.groupId}
              gone={matched.has(p.groupId)}
              onPress={() => setSelected(p.groupId)}
            />
          ))}
        </View>
        <View style={{ flex: 1, gap: spacing.md }}>
          {r.answers.map((a) => (
            <Tile
              key={a.groupId}
              text={a.answer}
              accent={colors.partner}
              gone={matched.has(a.groupId)}
              onPress={() => tapAnswer(a.groupId, a.answer)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function Tile({
  text,
  accent,
  selected = false,
  gone = false,
  onPress,
}: {
  text: string;
  accent: string;
  selected?: boolean;
  gone?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={gone}
      onPress={onPress}
      style={{
        backgroundColor: selected ? accent : colors.surface,
        borderWidth: 1,
        borderColor: selected ? accent : colors.border,
        borderRadius: radius.md,
        padding: spacing.lg,
        alignItems: 'center',
        opacity: gone ? 0.2 : 1,
      }}
    >
      <AppText variant="bodyStrong" color={selected ? '#0B0D10' : accent}>
        {text}
      </AppText>
    </Pressable>
  );
}
