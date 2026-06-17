import { View, FlatList, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { ListCard } from '../../../src/ui/components/list-card';

export default function ListsScreen() {
  const profile = useProfile();
  const { lists } = useUserLists(profile.uid);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <ListCard list={item} onPress={() => router.push(`/(app)/lists/${item.id}`)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No lists yet. Create one below.</Text>}
      />
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={() => router.push('/(app)/lists/new')}>
          <Text style={styles.primaryText}>+ New list</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/(app)/join')}>
          <Text>Join with code</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  actions: { gap: 8 },
  primary: { backgroundColor: '#1a73e8', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '700' },
  secondary: { padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#e5e7eb' },
});
