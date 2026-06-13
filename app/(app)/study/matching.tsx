import { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDueCards } from '../../../src/hooks/use-due-cards';
import { buildMatchingRound } from '../../../src/domain/quiz';
import { gradeStudy } from '../../../src/data/progress';
import { recordStudyDay } from '../../../src/data/stats';
import { useProfile } from '../../../src/store/session';

export default function Matching() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const { cards, loading } = useDueCards(listId);
  const round = useMemo(() => (cards.length ? buildMatchingRound(cards, 5) : null), [cards]);

  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <View style={styles.c}><ActivityIndicator /></View>;
  if (!round || cards.length === 0) return <View style={styles.c}><Text style={styles.done}>Nothing due. 🎉</Text></View>;

  const allMatched = matched.size === round.prompts.length;
  if (allMatched) {
    recordStudyDay(profile.uid);
    return <View style={styles.c}><Text style={styles.done}>Matched all in {seconds}s! 🎉</Text></View>;
  }

  async function tapAnswer(groupId: string) {
    if (!selectedPrompt) return;
    if (selectedPrompt === groupId) {
      const m = new Set(matched);
      m.add(groupId);
      setMatched(m);
      await gradeStudy(profile.uid, groupId, 4);
    }
    setSelectedPrompt(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{seconds}s</Text>
      <View style={styles.cols}>
        <View style={styles.col}>
          {round.prompts.map((p) => (
            <Pressable
              key={p.groupId}
              disabled={matched.has(p.groupId)}
              style={[styles.tile, selectedPrompt === p.groupId && styles.sel, matched.has(p.groupId) && styles.gone]}
              onPress={() => setSelectedPrompt(p.groupId)}
            >
              <Text>{p.prompt}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.col}>
          {round.answers.map((a) => (
            <Pressable
              key={a.groupId}
              disabled={matched.has(a.groupId)}
              style={[styles.tile, matched.has(a.groupId) && styles.gone]}
              onPress={() => tapAnswer(a.groupId)}
            >
              <Text>{a.answer}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timer: { textAlign: 'center', fontSize: 18, marginBottom: 12, color: '#6b7280' },
  cols: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 8 },
  tile: { padding: 16, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  sel: { backgroundColor: '#bfdbfe' },
  gone: { opacity: 0.25 },
  done: { fontSize: 22, fontWeight: '700' },
});
