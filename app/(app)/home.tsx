import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, UserPlus, Play, ChevronRight, BookOpen } from 'lucide-react-native';
import { DateTime } from 'luxon';
import { useProfile } from '../../src/store/session';
import { useUserLists } from '../../src/hooks/use-user-lists';
import { useStudySummary } from '../../src/hooks/use-study-summary';
import { learnerLevel } from '../../src/domain/progress-stats';
import { Screen } from '../../src/ui/components/screen';
import { AppText } from '../../src/ui/components/app-text';
import { Card } from '../../src/ui/components/card';
import { Button } from '../../src/ui/components/button';
import { StreakBadge } from '../../src/ui/components/streak-badge';
import { ProgressBar } from '../../src/ui/components/progress-bar';
import { ListCard } from '../../src/ui/components/list-card';
import { SectionHeader } from '../../src/ui/components/section-header';
import { Icon } from '../../src/ui/components/icon';
import { EmptyState } from '../../src/ui/components/empty-state';
import { colors, spacing } from '../../src/ui/theme';

function greeting(): string {
  const h = DateTime.now().hour;
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const profile = useProfile();
  const router = useRouter();
  const { lists } = useUserLists(profile.uid);
  const { knownCount, dueCount } = useStudySummary(profile.uid);
  const level = learnerLevel(knownCount);
  const continueList = lists[0];

  return (
    <Screen scroll>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.lg,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <AppText variant="caption" color={colors.textMuted}>
            {greeting()}
          </AppText>
          <AppText variant="h1">{profile.displayName.split(' ')[0]}</AppText>
        </View>
        <StreakBadge current={profile.streak.current} />
      </View>

      <Card style={{ marginTop: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="bodyStrong">Level {level.level}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {level.into}/{level.needed} words
          </AppText>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={level.progress / 100} />
        </View>
      </Card>

      {continueList ? (
        <Card
          onPress={() => router.push(`/(app)/study/flashcards?listId=${continueList.id}`)}
          style={{ marginTop: spacing.lg }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: colors.youSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon={Play} color={colors.you} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.textMuted}>
                {dueCount > 0 ? `${dueCount} due` : 'Keep going'}
              </AppText>
              <AppText variant="bodyStrong">{continueList.name}</AppText>
            </View>
            <Icon icon={ChevronRight} color={colors.textMuted} />
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Quick actions" />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button title="New list" icon={Plus} onPress={() => router.push('/(app)/lists/new')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Join"
            icon={UserPlus}
            variant="secondary"
            onPress={() => router.push('/(app)/join')}
          />
        </View>
      </View>

      <SectionHeader
        title="Your lists"
        action={
          lists.length > 0 ? (
            <AppText
              variant="caption"
              color={colors.you}
              onPress={() => router.push('/(app)/lists')}
            >
              See all
            </AppText>
          ) : undefined
        }
      />
      {lists.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Start your first list"
          body="Create a list to begin collecting words with your partner."
          actionLabel="Create a list"
          onAction={() => router.push('/(app)/lists/new')}
        />
      ) : (
        lists
          .slice(0, 3)
          .map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onPress={() => router.push(`/(app)/lists/${list.id}`)}
            />
          ))
      )}
    </Screen>
  );
}
