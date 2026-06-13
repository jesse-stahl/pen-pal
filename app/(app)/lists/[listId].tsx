import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';
import { ListDoc } from '../../../src/firebase/schema';
import { useListWords } from '../../../src/hooks/use-list-words';

export default function ListDetail() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const { words } = useListWords(listId);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) =>
      setList(s.exists() ? ({ id: s.id, ...s.data() } as ListDoc) : null)
    );
  }, [listId]);

  if (!list) return <View style={styles.container}><Text>Loading…</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{list.name}</Text>
        <Pressable onPress={() => router.push(`/(app)/lists/${listId}/members`)}>
          <Text style={styles.link}>Members ({list.memberUids.length})</Text>
        </Pressable>
      </View>

      <FlatList
        data={words}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.word}
            onPress={() => router.push(`/(app)/words/${item.id}?listId=${listId}`)}
          >
            <Text style={styles.termA}>{item.terms[list.langA]}</Text>
            <Text style={styles.termB}>{item.terms[list.langB]}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No words yet.</Text>}
      />

      <Pressable
        style={styles.fab}
        onPress={() =>
          router.push(`/(app)/words/new?listId=${listId}&langA=${list.langA}&langB=${list.langB}`)
        }
      >
        <Text style={styles.fabText}>+ Add word</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  link: { color: '#1a73e8' },
  word: { padding: 14, borderRadius: 10, backgroundColor: '#f3f4f6', marginBottom: 8 },
  termA: { fontSize: 16, fontWeight: '600' },
  termB: { fontSize: 16, color: '#374151' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  fab: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 12, alignItems: 'center' },
  fabText: { color: 'white', fontWeight: '700' },
});
