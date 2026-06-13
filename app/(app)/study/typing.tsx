import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { isAcceptable } from '../../../src/domain/answer-match';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function Typing() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  if (loading) return <View style={styles.c}><ActivityIndicator /></View>;
  if (cards.length === 0) return <View style={styles.c}><Text style={styles.done}>Nothing due. 🎉</Text></View>;
  if (i >= cards.length) { recordStudyDay(profile.uid); return <View style={styles.c}><Text style={styles.done}>Done! 🎉</Text></View>; }

  const card = cards[i];

  async function check() {
    const ok = isAcceptable(card.answer, input);
    setResult(ok ? 'correct' : 'wrong');
    await gradeStudy(profile.uid, card.groupId, ok ? 4 : 1);
  }
  function next() {
    setInput('');
    setResult(null);
    setI((n) => n + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{i + 1} / {cards.length}</Text>
      <Text style={styles.prompt}>{card.prompt}</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        editable={result === null}
        placeholder="Type the translation"
        autoFocus
      />
      {result === null ? (
        <Button title="Check" onPress={check} disabled={!input.trim()} />
      ) : (
        <View>
          <Text style={[styles.feedback, result === 'correct' ? styles.ok : styles.bad]}>
            {result === 'correct' ? 'Correct!' : `Answer: ${card.answer}`}
          </Text>
          <Button title="Next" onPress={next} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progress: { textAlign: 'center', color: '#6b7280', marginBottom: 12 },
  prompt: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginVertical: 32 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 16, fontSize: 20, textAlign: 'center', marginBottom: 16 },
  feedback: { fontSize: 20, textAlign: 'center', marginBottom: 12 },
  ok: { color: '#16a34a' },
  bad: { color: '#dc2626' },
  done: { fontSize: 22, fontWeight: '700' },
});
