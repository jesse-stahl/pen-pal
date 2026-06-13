import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { acceptInvite } from '../../src/data/invites';
import { useProfile } from '../../src/store/session';

const MESSAGES: Record<string, string> = {
  invalid: 'That code is not valid.',
  expired: 'That invite has expired.',
  exhausted: 'That invite has been used too many times.',
  'already-member': 'You are already in this list.',
};

export default function Join() {
  const profile = useProfile();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function join() {
    setError('');
    const res = await acceptInvite(code, profile);
    if (res.ok) router.replace(`/(app)/lists/${res.listId}`);
    else setError(MESSAGES[res.reason]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter invite code</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="PNK-7Q2"
        autoCapitalize="characters"
        autoFocus
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button title="Join list" onPress={join} disabled={!code.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  label: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 20, letterSpacing: 2, textAlign: 'center' },
  error: { color: '#dc2626' },
});
