import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function Flashcards() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (loading) return <Center><ActivityIndicator /></Center>;
  if (cards.length === 0) return <Center><Text style={styles.done}>Nothing due. 🎉</Text></Center>;
  if (i >= cards.length) {
    return <Center><Text style={styles.done}>Session complete! 🎉</Text></Center>;
  }

  const card = cards[i];

  async function grade(g: number) {
    await gradeStudy(profile.uid, card.groupId, g);
    setFlipped(false);
    if (i + 1 >= cards.length) recordStudyDay(profile.uid);
    setI((n) => n + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{i + 1} / {cards.length}</Text>
      <Pressable style={styles.card} onPress={() => setFlipped((f) => !f)}>
        <Text style={styles.term}>{flipped ? card.answer : card.prompt}</Text>
        <Text style={styles.hint}>{flipped ? 'answer' : 'tap to flip'}</Text>
      </Pressable>
      {flipped && (
        <View style={styles.grades}>
          <GradeBtn label="Again" color="#dc2626" onPress={() => grade(1)} />
          <GradeBtn label="Hard" color="#d97706" onPress={() => grade(3)} />
          <GradeBtn label="Good" color="#16a34a" onPress={() => grade(4)} />
          <GradeBtn label="Easy" color="#0284c7" onPress={() => grade(5)} />
        </View>
      )}
    </View>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>{children}</View>;
}
function GradeBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.grade, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.gradeText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  progress: { textAlign: 'center', color: '#6b7280', marginBottom: 12 },
  card: { flex: 1, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  term: { fontSize: 36, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16 },
  hint: { marginTop: 12, color: '#9ca3af' },
  grades: { flexDirection: 'row', gap: 8, marginTop: 16 },
  grade: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  gradeText: { color: 'white', fontWeight: '700' },
  done: { fontSize: 22, fontWeight: '700' },
});
