import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';
import { ListDoc, WordDoc } from '../../../src/firebase/schema';
import { getWord, updateWord, deleteWord } from '../../../src/data/words';
import { getLanguageName } from '../../../src/domain/languages';
import { useProfile } from '../../../src/store/session';

export default function EditWord() {
  const { wordId, listId } = useLocalSearchParams<{ wordId: string; listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const [word, setWord] = useState<WordDoc | null>(null);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  useEffect(() => {
    (async () => {
      if (!listId || !wordId) return;
      const w = await getWord(listId, wordId);
      if (w && list) {
        setWord(w);
        setA(w.terms[list.langA] ?? '');
        setB(w.terms[list.langB] ?? '');
        setNotes(w.notes ?? '');
      }
    })();
  }, [listId, wordId, list?.id]);

  if (!listId || !wordId || !list || !word) {
    return <View style={styles.container}><Text>Loading…</Text></View>;
  }

  // Capture the narrowed list so the closures below keep a non-null type
  // (TypeScript does not preserve narrowing of state vars inside nested functions).
  const currentList = list;

  async function save() {
    await updateWord({
      listId,
      wordId,
      terms: { [currentList.langA]: a.trim(), [currentList.langB]: b.trim() },
      notes: notes.trim(),
      updatedBy: profile.uid,
    });
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Delete word', 'Remove this word from the list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteWord(listId, wordId); router.back(); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getLanguageName(list.langA)}</Text>
      <TextInput style={styles.input} value={a} onChangeText={setA} />
      <Text style={styles.label}>{getLanguageName(list.langB)}</Text>
      <TextInput style={styles.input} value={b} onChangeText={setB} />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline />
      <Button title="Save" onPress={save} disabled={!a.trim() || !b.trim()} />
      <View style={{ height: 8 }} />
      <Button title="Delete" color="#dc2626" onPress={confirmDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
});
