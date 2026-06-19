import { useState } from 'react';
import { View, Switch } from 'react-native';
import { Flame, BookCheck, ArrowLeftRight, Bell, LogOut } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../src/hooks/use-auth';
import { useProfile } from '../../src/store/session';
import { useStudySummary } from '../../src/hooks/use-study-summary';
import { useStats } from '../../src/hooks/use-stats';
import { useUserLists } from '../../src/hooks/use-user-lists';
import { scheduleDailyReminder } from '../../src/services/notifications';
import { getLanguageName } from '../../src/domain/languages';
import { todayKey } from '../../src/domain/clock';
import { weeklyActivity, deriveAchievements } from '../../src/domain/progress-stats';
import { Screen } from '../../src/ui/components/screen';
import { AppText } from '../../src/ui/components/app-text';
import { Card } from '../../src/ui/components/card';
import { Button } from '../../src/ui/components/button';
import { StatTile } from '../../src/ui/components/stat-tile';
import { SectionHeader } from '../../src/ui/components/section-header';
import { Icon } from '../../src/ui/components/icon';
import { colors, spacing, radius } from '../../src/ui/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Profile() {
  const { signOut } = useAuth();
  const profile = useProfile();
  const { knownCount } = useStudySummary(profile.uid);
  const { trades } = useStats(profile);
  const { lists } = useUserLists(profile.uid);
  const [reminderOn, setReminderOn] = useState(false);

  const week = weeklyActivity(profile.streak, todayKey());
  const tradeTotal = trades.reduce((sum, t) => sum + t.iTaughtThem + t.theyTaughtMe, 0);
  const achievements = deriveAchievements({
    streak: profile.streak,
    knownCount,
    tradeCount: trades.length,
    listCount: lists.length,
  });

  async function toggleReminder(on: boolean) {
    setReminderOn(on);
    if (on) await scheduleDailyReminder(19);
    else await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: radius.pill,
            backgroundColor: colors.youSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="h2" color={colors.you}>
            {profile.displayName.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <AppText variant="h2" style={{ marginTop: spacing.md }}>
          {profile.displayName}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
          {getLanguageName(profile.nativeLang)} → {getLanguageName(profile.targetLang)}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
        <StatTile icon={Flame} value={`${profile.streak.current}`} label="Day streak" accent={colors.warning} />
        <StatTile icon={BookCheck} value={`${knownCount}`} label="Words learned" accent={colors.success} />
        <StatTile icon={ArrowLeftRight} value={`${tradeTotal}`} label="Words traded" accent={colors.partner} />
      </View>

      <SectionHeader title="This week" />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {week.map((active, idx) => (
            <View key={idx} style={{ alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.success : colors.elevated,
                }}
              />
              <AppText variant="label" color={colors.textMuted}>
                {DAYS[idx]}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Achievements" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {achievements.map((ach) => (
          <View
            key={ach.id}
            style={{
              width: '47%',
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: ach.unlocked ? colors.you : colors.border,
              padding: spacing.lg,
              opacity: ach.unlocked ? 1 : 0.5,
            }}
          >
            <AppText variant="bodyStrong" color={ach.unlocked ? colors.you : colors.textMuted}>
              {ach.title}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
              {ach.description}
            </AppText>
          </View>
        ))}
      </View>

      <SectionHeader title="Settings" />
      <Card>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Icon icon={Bell} size={20} color={colors.textSecondary} />
            <AppText variant="body">Daily reminder (7pm)</AppText>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={toggleReminder}
            trackColor={{ true: colors.you, false: colors.elevated }}
            thumbColor={colors.text}
          />
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Sign out" icon={LogOut} variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
