import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { savePushToken } from '../data/push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(uid: string): Promise<void> {
  // Push is a non-critical enhancement and requires native FCM (Android) / APNs (iOS)
  // credentials that may not be configured yet. Never let setup failures crash the app.
  try {
    if (!Device.isDevice) return;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await savePushToken(uid, token);
  } catch (err) {
    console.warn('Push registration skipped (FCM/APNs not configured yet):', err);
  }
}

/** Schedule a repeating local daily study reminder at the given hour (0-23). */
export async function scheduleDailyReminder(hour: number, minute = 0): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Time to study 📚', body: 'Keep your streak alive — review your words.' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
