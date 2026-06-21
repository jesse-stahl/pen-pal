import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useStudyDeck } from '../../../src/hooks/use-study-deck';
import { buildMultipleChoice } from '../../../src/domain/quiz';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';
import { useStudySession } from '../../../src/store/study-session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { StudyHeader } from '../../../src/ui/components/study-header';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function MultipleChoice() {
  const { listId, mode } = useLocalSearchParams<{ listId?: string; mode?: string }>();
  const profile = useProfile();
  const router = useRouter();
  const { cards, loading } = useStudyDeck(listId, mode === 'review' ? 'review' : 'normal');
  const { start, log } = useStudySession();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && cards.length > 0) start(cards.length, 'multiple-choice', listId ?? 'all');
  }, [loading, cards.length, listId, start]);
  useEffect(() => {
    if (!loading && cards.length === 0) router.replace('/(app)/study/results');
  }, [loading, cards.length, router]);
  // Each focus starts a fresh session; this Tabs screen stays mounted between visits.
  useFocusEffect(
    useCallback(() => {
      setI(0);
      setPicked(null);
    }, []),
  );

  const question = useMemo(
    () => (cards.length && i < cards.length ? buildMultipleChoice(cards[i], cards, 4) : null),
    [cards, i],
  );

  if (loading) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.you} />
      </Screen>
    );
  }
  if (!question) return null;
  const q = question;

  async function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.correct;
    log({ prompt: q.card.prompt, answer: q.correct, correct });
    await gradeStudy(profile.uid, q.card.groupId, correct ? 4 : 1);
    const isLast = i + 1 >= cards.length;
    setTimeout(async () => {
      setPicked(null);
      if (isLast) {
        await recordStudyDay(profile.uid);
        router.replace('/(app)/study/results');
        return;
      }
      setI((n) => n + 1);
    }, 700);
  }

  return (
    <Screen>
      <StudyHeader index={i} total={cards.length} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
          Choose the translation
        </AppText>
        <AppText
          variant="h1"
          color={colors.you}
          style={{ textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xxl }}
        >
          {q.card.prompt}
        </AppText>

        <View style={{ gap: spacing.md }}>
          {q.options.map((opt) => {
            const isCorrect = picked !== null && opt === q.correct;
            const isWrong = picked === opt && opt !== q.correct;
            const bg = isCorrect ? colors.successSoft : isWrong ? colors.dangerSoft : colors.surface;
            const border = isCorrect ? colors.success : isWrong ? colors.danger : colors.border;
            return (
              <Pressable
                key={opt}
                onPress={() => pick(opt)}
                style={{
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <AppText variant="bodyStrong" style={{ textAlign: 'center' }}>
                  {opt}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
