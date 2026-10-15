import { useCallback, useEffect, useState } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useStudyDeck } from '../../../src/hooks/use-study-deck';
import { isAcceptable } from '../../../src/domain/answer-match';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';
import { useStudySession } from '../../../src/store/study-session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Button } from '../../../src/ui/components/button';
import { StudyHeader } from '../../../src/ui/components/study-header';
import { SpeakButton } from '../../../src/ui/components/speak-button';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function Typing() {
  const { listId, mode } = useLocalSearchParams<{ listId?: string; mode?: string }>();
  const profile = useProfile();
  const router = useRouter();
  const { cards, loading } = useStudyDeck(listId, mode === 'review' ? 'review' : 'normal');
  const { start, log } = useStudySession();
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  useEffect(() => {
    if (!loading && cards.length > 0) start(cards.length, 'typing', listId ?? 'all');
  }, [loading, cards.length, listId, start]);
  useEffect(() => {
    if (!loading && cards.length === 0) router.replace('/(app)/study/results');
  }, [loading, cards.length, router]);
  // Each focus starts a fresh session.
  useFocusEffect(
    useCallback(() => {
      setI(0);
      setInput('');
      setResult(null);
    }, []),
  );

  if (loading) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.you} />
      </Screen>
    );
  }
  if (cards.length === 0) return null;
  const card = cards[i];

  async function check() {
    const ok = isAcceptable(card.answer, input);
    setResult(ok ? 'correct' : 'wrong');
    log({ prompt: card.prompt, answer: card.answer, correct: ok });
    await gradeStudy(profile.uid, card.groupId, ok ? 4 : 1);
  }

  async function next() {
    setInput('');
    setResult(null);
    if (i + 1 >= cards.length) {
      await recordStudyDay(profile.uid);
      router.replace('/(app)/study/results');
      return;
    }
    setI((n) => n + 1);
  }

  const borderColor =
    result === 'correct' ? colors.success : result === 'wrong' ? colors.danger : colors.border;

  return (
    <Screen>
      <StudyHeader index={i} total={cards.length} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
          Type the translation
        </AppText>
        <AppText
          variant="h1"
          color={colors.you}
          style={{ textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xxl }}
        >
          {card.prompt}
        </AppText>

        <TextInput
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor,
            borderRadius: radius.lg,
            padding: spacing.lg,
            fontSize: 20,
            fontFamily: 'Inter_600SemiBold',
            color: colors.text,
            textAlign: 'center',
          }}
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={result === null}
          placeholder="Your answer"
          autoFocus
        />

        {result !== null ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              marginTop: spacing.lg,
            }}
          >
            <AppText variant="bodyStrong" color={result === 'correct' ? colors.success : colors.danger}>
              {result === 'correct' ? 'Correct!' : `Answer: ${card.answer}`}
            </AppText>
            <SpeakButton text={card.answer} lang={profile.targetLang} />
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          {result === null ? (
            <Button title="Check" onPress={check} disabled={!input.trim()} />
          ) : (
            <Button title="Next" onPress={next} />
          )}
        </View>
      </View>
    </Screen>
  );
}
