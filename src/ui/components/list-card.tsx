import { Text, Pressable, StyleSheet } from 'react-native';
import { ListDoc } from '../../firebase/schema';

function membershipLabel(n: number): string {
  if (n <= 1) return 'Private';
  if (n === 2) return 'Shared';
  return `Group · ${n}`;
}

export function ListCard({ list, onPress }: { list: ListDoc; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{list.name}</Text>
      <Text style={styles.meta}>
        {membershipLabel(list.memberUids.length)} · {list.wordCount} words
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f3f4f6', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '600' },
  meta: { color: '#6b7280', marginTop: 4 },
});
