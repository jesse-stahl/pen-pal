import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLanguageName } from '../../../src/domain/languages';
import { translate } from '../../../src/services/translate';
import { addWord } from '../../../src/data/words';
import { useProfile } from '../../../src/store/session';

export default function NewWord() {
  const { listId, langA, langB } = useLocalSearchParams<{ listId: string; langA: string; langB: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  // Route params are typed as string but can be missing at runtime; guard once
  // so the rest of the component (and its closures) sees them as defined.
  if (!listId || !langA || !langB) {
    return <View style={styles.container}><Text>Missing list context.</Text></View>;
  }

  async function autoTranslate(from: 'A' | 'B') {
    setBusy(true);
    try {
      if (from === 'A' && a.trim()) {
        setB(await translate({ text: a.trim(), source: langA, target: langB }));
      } else if (from === 'B' && b.trim()) {
        setA(await translate({ text: b.trim(), source: langB, target: langA }));
      }
    } catch {
      Alert.alert('Translation failed', 'You can still type it manually.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!a.trim() || !b.trim()) return;
    await addWord({
      listIds: [listId],
      terms: { [langA]: a.trim(), [langB]: b.trim() },
      notes: notes.trim(),
      createdBy: profile.uid,
    });
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getLanguageName(langA)}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={a} onChangeText={setA} autoFocus />
        <Button title="→" onPress={() => autoTranslate('A')} />
      </View>

      <Text style={styles.label}>{getLanguageName(langB)}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} value={b} onChangeText={setB} />
        <Button title="←" onPress={() => autoTranslate('B')} />
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline />

      {busy && <ActivityIndicator />}
      <Button title="Save word" onPress={save} disabled={!a.trim() || !b.trim() || busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
});
