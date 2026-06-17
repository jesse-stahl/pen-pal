import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { buildMultipleChoice } from '../../../src/domain/quiz';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function MultipleChoice() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const question = useMemo(
    () => (cards.length && i < cards.length ? buildMultipleChoice(cards[i], cards, 4) : null),
    [cards, i]
  );

  if (loading) return <View style={styles.c}><ActivityIndicator /></View>;
  if (cards.length === 0) return <View style={styles.c}><Text style={styles.done}>Nothing due. 🎉</Text></View>;
  if (i >= cards.length) return <View style={styles.c}><Text style={styles.done}>Done! 🎉</Text></View>;
  if (!question) return null;
  // Capture the narrowed question so the closure keeps a non-null type.
  const q = question;

  async function pick(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.correct;
    await gradeStudy(profile.uid, q.card.groupId, correct ? 4 : 1);
    const isLast = i + 1 >= cards.length;
    setTimeout(() => {
      setPicked(null);
      setI((n) => n + 1);
      if (isLast) recordStudyDay(profile.uid);
    }, 700);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{i + 1} / {cards.length}</Text>
      <Text style={styles.prompt}>{question.card.prompt}</Text>
      <View style={styles.options}>
        {question.options.map((opt) => {
          const isCorrect = picked && opt === question.correct;
          const isWrongPick = picked === opt && opt !== question.correct;
          return (
            <Pressable
              key={opt}
              style={[styles.option, isCorrect && styles.correct, isWrongPick && styles.wrong]}
              onPress={() => pick(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progress: { textAlign: 'center', color: '#6b7280', marginBottom: 12 },
  prompt: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginVertical: 32 },
  options: { gap: 12 },
  option: { padding: 18, borderRadius: 12, backgroundColor: '#f3f4f6' },
  optionText: { fontSize: 18, textAlign: 'center' },
  correct: { backgroundColor: '#bbf7d0' },
  wrong: { backgroundColor: '#fecaca' },
  done: { fontSize: 22, fontWeight: '700' },
});
