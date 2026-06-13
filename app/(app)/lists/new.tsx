import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../src/store/session';
import { createList } from '../../../src/data/lists';

export default function NewList() {
  const profile = useProfile();
  const router = useRouter();
  const [name, setName] = useState('');

  async function create() {
    if (!name.trim()) return;
    const [langA, langB] = [profile.nativeLang, profile.targetLang].sort();
    const id = await createList({ name: name.trim(), owner: profile, langA, langB });
    router.replace(`/(app)/lists/${id}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>List name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Food & Drinks"
        autoFocus
      />
      <Button title="Create" onPress={create} disabled={!name.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
});
