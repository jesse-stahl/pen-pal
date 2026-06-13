import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useProfile } from '../../src/store/session';
import { useStats } from '../../src/hooks/use-stats';

export default function Stats() {
  const profile = useProfile();
  const { trades } = useStats(profile);

  return (
    <View style={styles.container}>
      <View style={styles.streakCard}>
        <Text style={styles.streakNum}>{profile.streak.current}🔥</Text>
        <Text style={styles.streakLabel}>day streak (best {profile.streak.longest})</Text>
      </View>

      <Text style={styles.h}>Word trades</Text>
      <FlatList
        data={trades}
        keyExtractor={(t) => t.partnerUid}
        renderItem={({ item }) => (
          <View style={styles.tradeRow}>
            <Text style={styles.tradeName}>{item.partnerName}</Text>
            <Text style={styles.tradeCounts}>
              You taught {item.iTaughtThem} · They taught {item.theyTaughtMe}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No shared words yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  streakCard: { padding: 24, borderRadius: 16, backgroundColor: '#fff7ed', alignItems: 'center', marginBottom: 24 },
  streakNum: { fontSize: 48, fontWeight: '800' },
  streakLabel: { color: '#9a3412' },
  h: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  tradeRow: { padding: 14, backgroundColor: '#f3f4f6', borderRadius: 10, marginBottom: 8 },
  tradeName: { fontWeight: '600' },
  tradeCounts: { color: '#6b7280', marginTop: 4 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 20 },
});
