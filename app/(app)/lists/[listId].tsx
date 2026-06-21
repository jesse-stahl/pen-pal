import { View, FlatList, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { Plus, Users, ChevronLeft, FileText } from 'lucide-react-native';
import { db } from '../../../src/firebase/config';
import { ListDoc } from '../../../src/firebase/schema';
import { useListWords } from '../../../src/hooks/use-list-words';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Button } from '../../../src/ui/components/button';
import { WordPair } from '../../../src/ui/components/word-pair';
import { EmptyState } from '../../../src/ui/components/empty-state';
import { Icon } from '../../../src/ui/components/icon';
import { Skeleton } from '../../../src/ui/components/skeleton';
import { colors, spacing } from '../../../src/ui/theme';

export default function ListDetail() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const { words } = useListWords(listId);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) =>
      setList(s.exists() ? ({ id: s.id, ...s.data() } as ListDoc) : null),
    );
  }, [listId]);

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
            {currentList.name}
          </AppText>
          <Pressable
            onPress={() => router.push(`/(app)/lists/${listId}/members`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
          >
            <Icon icon={Users} size={18} color={colors.partner} />
            <AppText variant="caption" color={colors.partner}>
              {currentList.memberUids.length}
            </AppText>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={words}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160, gap: spacing.md }}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/words/${item.id}?listId=${listId}`)}>
            <WordPair
              native={item.terms[currentList.langA] ?? '—'}
              target={item.terms[currentList.langB] ?? '—'}
            />
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
          </Card>
        )}
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
        <Button
          title="Add word"
          icon={Plus}
          onPress={() =>
            router.push(
              `/(app)/words/new?listId=${listId}&langA=${currentList.langA}&langB=${currentList.langB}`,
            )
          }
        />
      </View>
    </Screen>
  );
}
