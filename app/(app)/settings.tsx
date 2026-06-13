import { useState } from 'react';
import { View, Text, Button, StyleSheet, Switch } from 'react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useProfile } from '../../src/store/session';
import { scheduleDailyReminder } from '../../src/services/notifications';
import { getLanguageName } from '../../src/domain/languages';
import * as Notifications from 'expo-notifications';

export default function Settings() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const [reminderOn, setReminderOn] = useState(false);

  async function toggleReminder(on: boolean) {
    setReminderOn(on);
    if (on) await scheduleDailyReminder(19); // 7pm
    else await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.row}>Signed in as {profile.displayName}</Text>
      <Text style={styles.row}>
        Learning: {getLanguageName(profile.nativeLang)} → {getLanguageName(profile.targetLang)}
      </Text>

      <View style={styles.toggleRow}>
        <Text>Daily reminder (7pm)</Text>
        <Switch value={reminderOn} onValueChange={toggleReminder} />
      </View>

      <Button title="Sign out" color="#dc2626" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  row: { fontSize: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
