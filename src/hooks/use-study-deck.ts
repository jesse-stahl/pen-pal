import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDocs } from '@react-native-firebase/firestore';
import { listWordsQuery } from '../data/words';
import {
  ensureStudy, getDueStudies, getNotLearnedStudies, getLearnedStudies,
} from '../data/progress';
import { buildPromptAnswer } from '../domain/direction';
import { nowMs } from '../domain/clock';
import { Card, shuffle } from '../domain/quiz';
import { WordDoc, UserDoc, StudyDoc } from '../firebase/schema';
import { useProfile } from '../store/session';
import { useUserLists } from './use-user-lists';

export type StudyMode = 'normal' | 'review';

const DECK_MAX = 50;

/**
 * Ensure every word in the list has a study record in this user's direction, and
 * return the set of groupIds in the list (so the deck can be scoped to it — study
 * records are stored globally per groupId, not per list).
 */
async function seedFromList(listId: string, profile: UserDoc): Promise<string[]> {
  const snap = await getDocs(listWordsQuery(listId));
  const groupIds: string[] = [];
  for (const d of snap.docs) {
    const w = d.data() as WordDoc;
    groupIds.push(w.groupId);
    const pa = buildPromptAnswer(w.terms, profile.nativeLang, profile.targetLang);
    if (!pa) continue; // word lacks the user's language pair
    await ensureStudy({
      uid: profile.uid,
      groupId: w.groupId,
      prompt: pa.prompt,
      answer: pa.answer,
      sourceListId: listId,
    });
  }
  return groupIds;
}

/**
 * Builds a study deck for a game screen.
 * - `listId` undefined => "All lists" (study records span every list the user owns).
 * - mode 'normal'  => due cards first, falling back to ALL not-learned cards so a
 *                     session is never empty / is replayable any time.
 * - mode 'review'  => only cards the user has marked "fully learned".
 *
 * Refetches on every focus: the game screens live in the Tabs navigator and stay
 * mounted across navigations, so a plain effect would leave a stale deck.
 */
export function useStudyDeck(listId: string | undefined, mode: StudyMode) {
  const profile = useProfile();
  const { lists } = useUserLists(profile.uid);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        // Scope the deck to the groupIds in the chosen list(s). For "All lists"
        // (no listId) this spans every list the user is in.
        const scopeIds = listId ? [listId] : lists.map((l) => l.id);
        const inScope = new Set<string>();
        for (const id of scopeIds) {
          for (const g of await seedFromList(id, profile)) inScope.add(g);
        }
        const scoped = (list: StudyDoc[]) => list.filter((s) => inScope.has(s.groupId));

        let studies: StudyDoc[];
        if (mode === 'review') {
          studies = scoped(await getLearnedStudies(profile.uid, 1000));
        } else {
          const due = scoped(await getDueStudies(profile.uid, nowMs(), 1000));
          studies = due.length > 0 ? due : scoped(await getNotLearnedStudies(profile.uid, 1000));
        }
        if (!active) return;
        // Shuffle so each session presents words in a fresh random order (and a
        // random subset when the deck is larger than DECK_MAX).
        setCards(
          shuffle(studies)
            .slice(0, DECK_MAX)
            .map((s) => ({ groupId: s.groupId, prompt: s.prompt, answer: s.answer })),
        );
        setLoading(false);
      })();
      return () => {
        active = false;
      };
      // profile is stable for the session; keying on uid avoids refetch loops.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listId, mode, profile.uid, lists.length]),
  );

  return { cards, loading };
}
