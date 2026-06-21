import { View, Pressable } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Library } from 'lucide-react-native';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { useWordSelection } from '../../../src/store/word-selection';
import { copyWordsToList } from '../../../src/data/words';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { EmptyState } from '../../../src/ui/components/empty-state';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing } from '../../../src/ui/theme';

export default function CopyWords() {
  const { sourceListId, ids } = useLocalSearchParams<{ sourceListId: string; ids: string }>();
  const profile = useProfile();
  const router = useRouter();
  const { lists } = useUserLists(profile.uid);
  const { clear } = useWordSelection();
  const [busy, setBusy] = useState(false);

  const wordIds = (ids ?? '').split(',').filter(Boolean);
  const targets = lists.filter((l) => l.id !== sourceListId);

  async function copyTo(targetId: string) {
    if (busy || !sourceListId) return;
    setBusy(true);
    try {
      await copyWordsToList(sourceListId, targetId, wordIds, profile.uid);
      clear();
      router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Copy to…
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        {wordIds.length} {wordIds.length === 1 ? 'word' : 'words'} · pick a destination list.
      </AppText>

      {targets.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No other lists"
          body="Create another list to copy words into it."
        />
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {targets.map((l) => (
            <Card key={l.id} onPress={() => copyTo(l.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.elevated,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon icon={Library} color={colors.partner} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{l.name}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {l.wordCount} {l.wordCount === 1 ? 'word' : 'words'}
                  </AppText>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
