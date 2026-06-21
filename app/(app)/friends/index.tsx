import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, UserPlus, Check, X } from 'lucide-react-native';
import { useProfile } from '../../../src/store/session';
import { useFriends } from '../../../src/hooks/use-friends';
import { acceptFriendRequest, denyFriendRequest } from '../../../src/data/friends';
import { FriendRequestDoc } from '../../../src/firebase/schema';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Button } from '../../../src/ui/components/button';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function Friends() {
  const profile = useProfile();
  const router = useRouter();
  const { friends, incoming } = useFriends(profile.uid);

  const otherName = (r: FriendRequestDoc) =>
    r.from === profile.uid ? r.toUsername : r.fromUsername;

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.lg,
        }}
      >
        <AppText variant="h1">Friends</AppText>
        <Button
          title="Add"
          icon={UserPlus}
          full={false}
          onPress={() => router.push('/(app)/friends/add')}
        />
      </View>

      {incoming.length > 0 ? (
        <>
          <AppText
            variant="label"
            color={colors.textMuted}
            style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
          >
            REQUESTS
          </AppText>
          <View style={{ gap: spacing.md }}>
            {incoming.map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Avatar name={r.fromUsername} />
                  <AppText variant="bodyStrong" style={{ flex: 1 }}>
                    @{r.fromUsername}
                  </AppText>
                  <Pressable
                    onPress={() => acceptFriendRequest(r.id)}
                    hitSlop={8}
                    accessibilityLabel="Accept"
                    style={pillStyle(colors.successSoft)}
                  >
                    <Icon icon={Check} size={18} color={colors.success} />
                  </Pressable>
                  <Pressable
                    onPress={() => denyFriendRequest(r.id)}
                    hitSlop={8}
                    accessibilityLabel="Deny"
                    style={pillStyle(colors.dangerSoft)}
                  >
                    <Icon icon={X} size={18} color={colors.danger} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <AppText
        variant="label"
        color={colors.textMuted}
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      >
        FRIENDS
      </AppText>
      {friends.length === 0 ? (
        <AppText variant="caption" color={colors.textMuted}>
          No friends yet. Add someone by their username.
        </AppText>
      ) : (
        <View style={{ gap: spacing.md }}>
          {friends.map((r) => (
            <Card key={r.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={otherName(r)} />
                <AppText variant="bodyStrong">@{otherName(r)}</AppText>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: colors.youSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="bodyStrong" color={colors.you}>
        {(name || '?').charAt(0).toUpperCase()}
      </AppText>
    </View>
  );
}

function pillStyle(bg: string) {
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}
