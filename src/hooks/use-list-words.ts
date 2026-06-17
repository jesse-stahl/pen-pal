import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { listWordsQuery } from '../data/words';
import { WordDoc } from '../firebase/schema';

export function useListWords(listId: string | undefined) {
  const [words, setWords] = useState<WordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset subscription state
       when `listId` changes so stale words aren't shown while re-subscribing */
    if (!listId) {
      setWords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const unsub = onSnapshot(listWordsQuery(listId), (snap) => {
      setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WordDoc));
      setLoading(false);
    });
    return unsub;
  }, [listId]);

  return { words, loading };
}
