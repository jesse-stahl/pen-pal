import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { LANGUAGES } from '../../src/domain/languages';
import { setLanguages } from '../../src/data/users';
import { useAuth } from '../../src/hooks/use-auth';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [nativeLang, setNative] = useState('');
  const [targetLang, setTarget] = useState('');

  async function save() {
    if (!user || !nativeLang || !targetLang || nativeLang === targetLang) return;
    await setLanguages(user.uid, nativeLang, targetLang);
    await refreshProfile();
    router.replace('/(app)/lists');
  }

  const Picker = ({ label, value, onPick }: { label: string; value: string; onPick: (c: string) => void }) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <FlatList
        data={LANGUAGES}
        keyExtractor={(l) => l.code}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, value === item.code && styles.rowActive]}
            onPress={() => onPick(item.code)}
          >
            <Text>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your languages</Text>
      <View style={styles.cols}>
        <Picker label="I speak (native)" value={nativeLang} onPick={setNative} />
        <Picker label="I'm learning (target)" value={targetLang} onPick={setTarget} />
      </View>
      {nativeLang === targetLang && nativeLang !== '' && (
        <Text style={styles.error}>Native and target must differ.</Text>
      )}
      <Button title="Continue" onPress={save} disabled={!nativeLang || !targetLang || nativeLang === targetLang} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  cols: { flex: 1, flexDirection: 'row', gap: 12 },
  label: { fontWeight: '600', marginBottom: 8 },
  row: { padding: 12, borderRadius: 8 },
  rowActive: { backgroundColor: '#d6e4ff' },
  error: { color: 'red' },
});
