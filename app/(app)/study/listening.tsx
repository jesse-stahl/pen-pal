import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useStudyDeck } from '../../../src/hooks/use-study-deck';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { checkVoice } from '../../../src/services/speech';
import { VoiceStatus } from '../../../src/domain/voice-match';
import { getLanguageName } from '../../../src/domain/languages';
import { useProfile } from '../../../src/store/session';
import { useStudySession } from '../../../src/store/study-session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Button } from '../../../src/ui/components/button';
import { StudyHeader } from '../../../src/ui/components/study-header';
import { ListeningCard } from '../../../src/ui/components/listening-card';
import { GradeBar } from '../../../src/ui/components/grade-bar';
import { colors, spacing } from '../../../src/ui/theme';

function useVoiceStatus(lang: string): VoiceStatus | null {
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  useEffect(() => {
    let active = true;
    checkVoice(lang).then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, [lang]);
  return status;
}

export default function Listening() {
  const { listId, mode } = useLocalSearchParams<{ listId?: string; mode?: string }>();
  const profile = useProfile();
  const router = useRouter();
  const { cards, loading } = useStudyDeck(listId, mode === 'review' ? 'review' : 'normal');
  const voice = useVoiceStatus(profile.targetLang);
  const { start, log } = useStudySession();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!loading && cards.length > 0) start(cards.length, 'listening', listId ?? 'all');
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

  if (loading || voice === null) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.you} />
      </Screen>
    );
  }
  if (voice === 'missing') return <MissingVoice lang={profile.targetLang} onBack={() => router.back()} />;
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
      <ListeningCard
        flipped={flipped}
        prompt={card.prompt}
        answer={card.answer}
        lang={profile.targetLang}
        onFlip={() => setFlipped((f) => !f)}
      />
      {flipped ? <GradeBar onGrade={grade} /> : <View style={{ height: 64 }} />}
    </Screen>
  );
}

function MissingVoice({ lang, onBack }: { lang: string; onBack: () => void }) {
  const name = getLanguageName(lang);
  return (
    <Screen contentStyle={{ justifyContent: 'center', gap: spacing.lg }}>
      <AppText variant="h2" style={{ textAlign: 'center' }}>
        No {name} voice on this device
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ textAlign: 'center' }}>
        Listening needs a {name} text-to-speech voice. Install one in your phone&apos;s speech settings, then come
        back.
      </AppText>
      <Button title="Back" variant="secondary" onPress={onBack} />
    </Screen>
  );
}
