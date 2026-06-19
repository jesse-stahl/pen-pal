import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDocs } from 'firebase/firestore';
import { listWordsQuery } from '../data/words';
import { ensureStudy, getDueStudies } from '../data/progress';
import { buildPromptAnswer } from '../domain/direction';
import { nowMs } from '../domain/clock';
import { Card } from '../domain/quiz';
import { WordDoc, UserDoc } from '../firebase/schema';
import { useProfile } from '../store/session';

/** Make sure every word in the list has a study record in this user's direction. */
async function seedStudyRecords(listId: string, profile: UserDoc): Promise<void> {
  const wordsSnap = await getDocs(listWordsQuery(listId));
  for (const d of wordsSnap.docs) {
    const w = d.data() as WordDoc;
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
}

export function useDueCards(listId: string | undefined) {
  const profile = useProfile();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch on every focus, not just first mount. The game screens live in the Tabs
  // navigator, which keeps them mounted across navigations — so a plain useEffect would
  // never re-run when the user re-enters a game, leaving a stale (often empty) deck.
  useFocusEffect(
    useCallback(() => {
      if (!listId) return;
      let active = true;
      (async () => {
        setLoading(true);
        await seedStudyRecords(listId, profile);
        const due = await getDueStudies(profile.uid, nowMs());
        if (!active) return;
        setCards(due.map((s) => ({ groupId: s.groupId, prompt: s.prompt, answer: s.answer })));
        setLoading(false);
      })();
      return () => {
        active = false;
      };
      // profile is stable for the session; keying on uid avoids refetch loops.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listId, profile.uid]),
  );

  return { cards, loading };
}
