import { useEffect, useState } from 'react';
import { onSnapshot } from '@react-native-firebase/firestore';
import { userListsQuery } from '../data/lists';
import { ListDoc } from '../firebase/schema';

export function useUserLists(uid: string | undefined) {
  const [lists, setLists] = useState<ListDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset subscription state
       when `uid` changes so stale lists aren't shown while re-subscribing */
    if (!uid) {
      setLists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const unsub = onSnapshot(userListsQuery(uid), (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ListDoc));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { lists, loading };
}
