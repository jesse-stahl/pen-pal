import { useEffect, useRef, useState } from 'react';
import { View, FlatList, Share, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { ChevronLeft, Share2, RefreshCw } from 'lucide-react-native';
import { db } from '../../../../src/firebase/config';
import { ListDoc } from '../../../../src/firebase/schema';
import { refreshListCode } from '../../../../src/data/list-codes';
import { removeMember } from '../../../../src/data/lists';
import { useProfile } from '../../../../src/store/session';
import { getLanguageName } from '../../../../src/domain/languages';
import { Screen } from '../../../../src/ui/components/screen';
import { AppText } from '../../../../src/ui/components/app-text';
import { Card } from '../../../../src/ui/components/card';
import { Button } from '../../../../src/ui/components/button';
import { Icon } from '../../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../../src/ui/theme';

export default function Members() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const backfilled = useRef(false);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  // Existing lists created before static codes have no inviteCode; the owner
  // allocates one on first view. The ref guards against re-running mid-write.
  useEffect(() => {
    if (!listId || !list || backfilled.current) return;
    if (list.ownerUid === profile.uid && !list.inviteCode) {
      backfilled.current = true;
      refreshListCode(listId, '', profile.uid);
    }
  }, [listId, list, profile.uid]);

  if (!listId || !list) {
    return (
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          Loading…
        </AppText>
      </Screen>
    );
  }
  const isOwner = list.ownerUid === profile.uid;
  const currentList = list;
  const code = currentList.inviteCode;

  async function share() {
    if (!code) return;
    await Share.share({
      message: `Join my PenPal list "${currentList.name}" with code ${code}`,
    });
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
          <Icon icon={ChevronLeft} color={colors.textMuted} />
        </Pressable>
        <AppText variant="h1" style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
          Members
        </AppText>

        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="label" color={colors.textMuted}>
            INVITE CODE
          </AppText>
          <AppText variant="h2" color={colors.partner} style={{ letterSpacing: 3 }}>
            {code || '——'}
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs }}>
            <Button title="Share" icon={Share2} full={false} onPress={share} />
            {isOwner ? (
              <Button
                title="Refresh"
                icon={RefreshCw}
                variant="secondary"
                full={false}
                onPress={() => refreshListCode(listId, code, profile.uid)}
              />
            ) : null}
          </View>
        </Card>
      </View>

      <FlatList
        data={list.memberUids}
        keyExtractor={(uid) => uid}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}
        renderItem={({ item: uid }) => {
          const m = list.members[uid];
          const name = m?.displayName ?? uid;
          return (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.pill,
                    backgroundColor: colors.youSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText variant="bodyStrong" color={colors.you}>
                    {name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">
                    {name}
                    {uid === list.ownerUid ? ' · owner' : ''}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {getLanguageName(m?.nativeLang ?? '')} → {getLanguageName(m?.targetLang ?? '')}
                  </AppText>
                </View>
                {isOwner && uid !== profile.uid ? (
                  <Pressable onPress={() => removeMember(listId, uid)} hitSlop={8}>
                    <AppText variant="caption" color={colors.danger}>
                      Remove
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
