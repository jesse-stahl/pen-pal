import { View, FlatList, Pressable, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { Plus, Users, ChevronLeft, FileText, Copy, Trash2, X, Check } from 'lucide-react-native';
import { db } from '../../../src/firebase/config';
import { ListDoc } from '../../../src/firebase/schema';
import { useListWords } from '../../../src/hooks/use-list-words';
import { useWordSelection } from '../../../src/store/word-selection';
import { deleteWords } from '../../../src/data/words';
import { buildDisplayPair, orientLanguages } from '../../../src/domain/direction';
import { useProfile } from '../../../src/store/session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Button } from '../../../src/ui/components/button';
import { WordPair } from '../../../src/ui/components/word-pair';
import { EmptyState } from '../../../src/ui/components/empty-state';
import { Icon } from '../../../src/ui/components/icon';
import { Skeleton } from '../../../src/ui/components/skeleton';
import { SpeakButton } from '../../../src/ui/components/speak-button';
import { colors, spacing } from '../../../src/ui/theme';

export default function ListDetail() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const { words } = useListWords(listId);
  const { selecting, selectedIds, toggle, enter, clear } = useWordSelection();

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) =>
      setList(s.exists() ? ({ id: s.id, ...s.data() } as ListDoc) : null),
    );
  }, [listId]);

  // Leave selection mode whenever the screen loses focus.
  useFocusEffect(useCallback(() => () => clear(), [clear]));

  if (!list) {
    return (
      <Screen>
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Skeleton height={32} width="60%" />
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      </Screen>
    );
  }
  const currentList = list;
  // Orient word rows to the viewer's native language (native term shown first).
  const { nativeLang: nativeLangCode, targetLang: targetLangCode } = orientLanguages(
    currentList.langA,
    currentList.langB,
    profile.nativeLang,
  );

  function confirmBulkDelete() {
    const ids = [...selectedIds];
    Alert.alert('Delete words', `Remove ${ids.length} word${ids.length === 1 ? '' : 's'} from this list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWords(listId, ids);
          clear();
        },
      },
    ]);
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
          <Icon icon={ChevronLeft} color={colors.textMuted} />
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing.md,
          }}
        >
          <AppText variant="h1" style={{ flexShrink: 1 }}>
            {selecting ? `${selectedIds.size} selected` : currentList.name}
          </AppText>
          {selecting ? (
            <Pressable onPress={clear} hitSlop={12} accessibilityLabel="Cancel selection">
              <Icon icon={X} size={22} color={colors.textMuted} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push(`/(app)/lists/${listId}/members`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
            >
              <Icon icon={Users} size={18} color={colors.partner} />
              <AppText variant="caption" color={colors.partner}>
                {currentList.memberUids.length}
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={words}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160, gap: spacing.md }}
        renderItem={({ item }) => {
          const display = buildDisplayPair(item.terms, nativeLangCode, targetLangCode);
          const isSelected = selectedIds.has(item.id);
          return (
            <Card
              onPress={() =>
                selecting
                  ? toggle(item.id)
                  : router.push(`/(app)/words/${item.id}?listId=${listId}`)
              }
              onLongPress={() => enter(item.id)}
              style={isSelected ? { borderColor: colors.you, borderWidth: 1.5 } : undefined}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <WordPair native={display?.nativeTerm ?? '—'} target={display?.targetTerm ?? '—'} />
                  {item.notes ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        marginTop: spacing.sm,
                      }}
                    >
                      <Icon icon={FileText} size={13} color={colors.textMuted} />
                      <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                        {item.notes}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                {!selecting && display ? (
                  <SpeakButton text={display.audioTerm} lang={display.audioLang} size={20} />
                ) : null}
                {selecting ? (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.you : colors.border,
                      backgroundColor: isSelected ? colors.you : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected ? <Icon icon={Check} size={16} color="#0B0D10" /> : null}
                  </View>
                ) : null}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={Plus}
            title="No words yet"
            body="Add your first word to start studying this list."
          />
        }
      />

      <View
        style={{
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          bottom: spacing.xxxl + 32,
        }}
      >
        {selecting ? (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              title={`Copy (${selectedIds.size})`}
              icon={Copy}
              variant="secondary"
              full={false}
              onPress={() =>
                router.push(
                  `/(app)/words/copy?sourceListId=${listId}&ids=${[...selectedIds].join(',')}`,
                )
              }
            />
            <Button
              title={`Delete (${selectedIds.size})`}
              icon={Trash2}
              variant="danger"
              full={false}
              onPress={confirmBulkDelete}
            />
          </View>
        ) : (
          <Button
            title="Add word"
            icon={Plus}
            onPress={() =>
              router.push(
                `/(app)/words/new?listId=${listId}&langA=${currentList.langA}&langB=${currentList.langB}`,
              )
            }
          />
        )}
      </View>
    </Screen>
  );
}
