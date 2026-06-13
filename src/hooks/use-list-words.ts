import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { listWordsQuery } from '../data/words';
import { WordDoc } from '../firebase/schema';

export function useListWords(listId: string | undefined) {
  const [words, setWords] = useState<WordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listId) return;
    const unsub = onSnapshot(listWordsQuery(listId), (snap) => {
      setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WordDoc));
      setLoading(false);
    });
    return unsub;
  }, [listId]);

  return { words, loading };
}
