import { useCallback, useEffect, useState } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useStudyDeck } from '../../../src/hooks/use-study-deck';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';
import { useStudySession } from '../../../src/store/study-session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { StudyHeader } from '../../../src/ui/components/study-header';
import { GradeBar } from '../../../src/ui/components/grade-bar';
import { SpeakButton } from '../../../src/ui/components/speak-button';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function Flashcards() {
  const { listId, mode } = useLocalSearchParams<{ listId?: string; mode?: string }>();
  const profile = useProfile();
  const router = useRouter();
  const { cards, loading } = useStudyDeck(listId, mode === 'review' ? 'review' : 'normal');
  const { start, log } = useStudySession();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!loading && cards.length > 0) start(cards.length, 'flashcards', listId ?? 'all');
  }, [loading, cards.length, listId, start]);

  useEffect(() => {
    if (!loading && cards.length === 0) router.replace('/(app)/study/results');
  }, [loading, cards.length, router]);

  // Reset position whenever the screen gains focus so a fresh visit always starts at card 1.
  useFocusEffect(
    useCallback(() => {
      setI(0);
      setFlipped(false);
    }, []),
  );

  if (loading) {
    return (
      <Screen contentStyle={center}>
        <ActivityIndicator color={colors.you} />
      </Screen>
    );
  }
  if (cards.length === 0) return null;
  const card = cards[i];

  async function grade(g: number) {
    log({ prompt: card.prompt, answer: card.answer, correct: g >= 3 });
    await gradeStudy(profile.uid, card.groupId, g);
    setFlipped(false);
    if (i + 1 >= cards.length) {
      await recordStudyDay(profile.uid);
      router.replace('/(app)/study/results');
      return;
    }
    setI((n) => n + 1);
  }

  return (
    <Screen>
      <StudyHeader index={i} total={cards.length} />
      <Pressable style={{ flex: 1 }} onPress={() => setFlipped((f) => !f)}>
        <Card
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: flipped ? colors.partner : colors.you,
            borderWidth: 1.5,
            borderRadius: radius.xl,
          }}
        >
          <AppText
            variant="h1"
            color={flipped ? colors.partner : colors.you}
            style={{ textAlign: 'center', fontSize: 40, lineHeight: 46 }}
          >
            {flipped ? card.answer : card.prompt}
          </AppText>
          {flipped ? (
            <View style={{ marginTop: spacing.lg }}>
              <SpeakButton text={card.answer} lang={profile.targetLang} size={28} />
            </View>
          ) : null}
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.lg }}>
            {flipped ? 'How well did you know it?' : 'Tap to reveal'}
          </AppText>
        </Card>
      </Pressable>

      {flipped ? <GradeBar onGrade={grade} /> : <View style={{ height: 64 }} />}
    </Screen>
  );
}

const center = { justifyContent: 'center' as const, alignItems: 'center' as const };
