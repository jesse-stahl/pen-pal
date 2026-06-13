import { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Share, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../src/firebase/config';
import { ListDoc } from '../../../../src/firebase/schema';
import { createInvite } from '../../../../src/data/invites';
import { removeMember } from '../../../../src/data/lists';
import { useProfile } from '../../../../src/store/session';
import { getLanguageName } from '../../../../src/domain/languages';

export default function Members() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const [list, setList] = useState<ListDoc | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  if (!listId || !list) return <View style={styles.container}><Text>Loading…</Text></View>;
  const isOwner = list.ownerUid === profile.uid;
  // Capture the narrowed list so the closure keeps a non-null type.
  const currentList = list;

  async function invite() {
    const c = await createInvite(listId, profile.uid);
    setCode(c);
    await Share.share({ message: `Join my PenPal list "${currentList.name}" with code ${c}` });
  }

  return (
    <View style={styles.container}>
      <Button title="Invite someone" onPress={invite} />
      {code && <Text style={styles.code}>Code: {code}</Text>}
      <FlatList
        data={list.memberUids}
        keyExtractor={(uid) => uid}
        renderItem={({ item: uid }) => {
          const m = list.members[uid];
          return (
            <View style={styles.member}>
              <Text style={styles.memberName}>
                {m?.displayName ?? uid} {uid === list.ownerUid ? '· owner' : ''}
              </Text>
              <Text style={styles.memberMeta}>
                {getLanguageName(m?.nativeLang ?? '')} → {getLanguageName(m?.targetLang ?? '')}
              </Text>
              {isOwner && uid !== profile.uid && (
                <Pressable onPress={() => removeMember(listId, uid)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  code: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 2 },
  member: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10, marginBottom: 8 },
  memberName: { fontWeight: '600' },
  memberMeta: { color: '#6b7280' },
  remove: { color: '#dc2626', marginTop: 6 },
});
