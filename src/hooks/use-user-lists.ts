import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { userListsQuery } from '../data/lists';
import { ListDoc } from '../firebase/schema';

export function useUserLists(uid: string | undefined) {
  const [lists, setLists] = useState<ListDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(userListsQuery(uid), (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ListDoc));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { lists, loading };
}
