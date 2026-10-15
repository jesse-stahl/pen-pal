import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { db } from '../../../src/firebase/config';
import { ListDoc } from '../../../src/firebase/schema';
import { useListWords } from '../../../src/hooks/use-list-words';
import { useLearned } from '../../../src/hooks/use-learned';
import { useHorizontalSwipe, SwipeDirection } from '../../../src/hooks/use-horizontal-swipe';
import { orientLanguages } from '../../../src/domain/direction';
import { wrapIndex } from '../../../src/domain/wrap-index';
import { useProfile } from '../../../src/store/session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Icon } from '../../../src/ui/components/icon';
import { WordViewCard } from '../../../src/ui/components/word-view-card';
import { colors, spacing } from '../../../src/ui/theme';

export default function WordView() {
  const { wordId, listId } = useLocalSearchParams<{ wordId: string; listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const { words, loading: wordsLoading } = useListWords(listId);
  const [currentId, setCurrentId] = useState(wordId);
  const [direction, setDirection] = useState<SwipeDirection | null>(null);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  const found = words.findIndex((w) => w.id === currentId);
  const index = found === -1 ? 0 : found;
  const word = words.length > 0 ? words[index] : undefined;
  const { learned, toggle } = useLearned(profile.uid, word?.groupId);

  const swipe = useHorizontalSwipe((dir) => {
    if (words.length < 2) return;
    const next = words[wrapIndex(index + (dir === 'next' ? 1 : -1), words.length)];
    setDirection(dir);
    setCurrentId(next.id);
  });

  if (!list || !word) {
    return (
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          {!wordsLoading && words.length === 0 ? 'This list has no words.' : 'Loading…'}
        </AppText>
      </Screen>
    );
  }
  const langs = orientLanguages(list.langA, list.langB, profile.nativeLang);
  const entering = direction === null ? undefined : direction === 'next' ? SlideInRight : SlideInLeft;

  return (
    <Screen scroll>
      <ViewHeader
        position={`${index + 1} / ${words.length}`}
        onBack={() => router.back()}
        onEdit={() => router.push(`/(app)/words/${word.id}/edit?listId=${listId}`)}
      />
      <Animated.View key={word.id} entering={entering} {...swipe.panHandlers} style={{ marginTop: spacing.lg }}>
        <WordViewCard
          nativeTerm={word.terms[langs.nativeLang] ?? ''}
          targetTerm={word.terms[langs.targetLang] ?? ''}
          targetLang={langs.targetLang}
          notes={word.notes}
          learned={learned}
          onToggleLearned={toggle}
        />
      </Animated.View>
      {words.length > 1 ? (
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center', marginTop: spacing.lg }}>
          Swipe left or right for other words
        </AppText>
      ) : null}
    </Screen>
  );
}

function ViewHeader({ position, onBack, onEdit }: { position: string; onBack: () => void; onEdit: () => void }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}
    >
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="caption" color={colors.textMuted}>
        {position}
      </AppText>
      <Pressable onPress={onEdit} hitSlop={12} accessibilityLabel="Edit word">
        <Icon icon={Pencil} size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
