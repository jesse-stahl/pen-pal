import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';

const MODES = [
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'multiple-choice', label: 'Multiple choice' },
  { key: 'typing', label: 'Typing' },
  { key: 'matching', label: 'Matching' },
];

export default function StudyHub() {
  const profile = useProfile();
  const { lists } = useUserLists(profile.uid);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.h}>Pick a list, then a mode</Text>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <View style={styles.listBlock}>
            <Text style={styles.listName}>{item.name}</Text>
            <View style={styles.modes}>
              {MODES.map((m) => (
                <Pressable
                  key={m.key}
                  style={styles.mode}
                  onPress={() => router.push(`/(app)/study/${m.key}?listId=${item.id}`)}
                >
                  <Text style={styles.modeText}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  h: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  listBlock: { marginBottom: 20 },
  listName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: { backgroundColor: '#e0ecff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  modeText: { color: '#1a4ed8', fontWeight: '600' },
});
