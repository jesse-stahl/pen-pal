import { useState } from 'react';
import { View, Switch, Pressable, Image, ActivityIndicator, TextInput } from 'react-native';
import { Flame, BookCheck, ArrowLeftRight, Bell, LogOut, Camera, Users, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '../../../src/data/avatar';
import { setDisplayName } from '../../../src/data/users';
import { useAuth } from '../../../src/hooks/use-auth';
import { useProfile } from '../../../src/store/session';
import { useStudySummary } from '../../../src/hooks/use-study-summary';
import { useStats } from '../../../src/hooks/use-stats';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { scheduleDailyReminder } from '../../../src/services/notifications';
import { getLanguageName } from '../../../src/domain/languages';
import { todayKey } from '../../../src/domain/clock';
import { weeklyActivity, deriveAchievements } from '../../../src/domain/progress-stats';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Button } from '../../../src/ui/components/button';
import { StatTile } from '../../../src/ui/components/stat-tile';
import { SectionHeader } from '../../../src/ui/components/section-header';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Profile() {
  const { signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const profile = useProfile();
  const { knownCount } = useStudySummary(profile.uid);
  const { trades } = useStats(profile);
  const { lists } = useUserLists(profile.uid);
  const [reminderOn, setReminderOn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);

  async function saveName() {
    const n = nameInput.trim();
    if (!n) return;
    setEditingName(false);
    await setDisplayName(profile.uid, n);
    await refreshProfile();
  }

  async function pickAvatar() {
    if (uploading) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (res.canceled || !res.assets[0]) return;
    setUploading(true);
    try {
      await uploadAvatar(profile.uid, res.assets[0].uri);
      await refreshProfile();
    } finally {
      setUploading(false);
    }
  }

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
        <Pressable onPress={pickAvatar} accessibilityLabel="Change profile picture">
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.pill,
              backgroundColor: colors.youSoft,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {uploading ? (
              <ActivityIndicator color={colors.you} />
            ) : profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={{ width: 72, height: 72 }} />
            ) : (
              <AppText variant="h2" color={colors.you}>
                {profile.displayName.charAt(0).toUpperCase()}
              </AppText>
            )}
          </View>
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.elevated,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon={Camera} size={14} color={colors.textSecondary} />
          </View>
        </Pressable>
        {editingName ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}
          >
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              maxLength={40}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              style={{
                minWidth: 160,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                color: colors.text,
                fontFamily: 'Inter_700Bold',
                fontSize: 20,
                textAlign: 'center',
              }}
            />
            <Pressable onPress={saveName} hitSlop={8} accessibilityLabel="Save name">
              <Icon icon={Check} size={22} color={colors.success} />
            </Pressable>
            <Pressable
              onPress={() => {
                setEditingName(false);
                setNameInput(profile.displayName);
              }}
              hitSlop={8}
              accessibilityLabel="Cancel"
            >
              <Icon icon={X} size={22} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setNameInput(profile.displayName);
              setEditingName(true);
            }}
            style={{ marginTop: spacing.md }}
          >
            <AppText variant="h2">{profile.displayName}</AppText>
          </Pressable>
        )}
        {profile.username ? (
          <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
            @{profile.username}
          </AppText>
        ) : null}
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

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Button
          title="Friends"
          icon={Users}
          variant="secondary"
          onPress={() => router.push('/(app)/friends')}
        />
        <Button title="Sign out" icon={LogOut} variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}
