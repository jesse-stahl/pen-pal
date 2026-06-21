import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { FriendRequestDoc } from '../firebase/schema';

/**
 * Subscribes to friend requests in both directions (sent + received) and splits
 * them into accepted friends, incoming pending, and outgoing pending.
 */
export function useFriends(uid: string) {
  const [docs, setDocs] = useState<FriendRequestDoc[]>([]);

  useEffect(() => {
    const q1 = query(collection(db, 'friendRequests'), where('from', '==', uid));
    const q2 = query(collection(db, 'friendRequests'), where('to', '==', uid));

    let from: FriendRequestDoc[] = [];
    let to: FriendRequestDoc[] = [];
    const merge = () => {
      const map = new Map<string, FriendRequestDoc>();
      [...from, ...to].forEach((d) => map.set(d.id, d));
      setDocs([...map.values()]);
    };
    const u1 = onSnapshot(q1, (s) => {
      from = s.docs.map((d) => d.data() as FriendRequestDoc);
      merge();
    });
    const u2 = onSnapshot(q2, (s) => {
      to = s.docs.map((d) => d.data() as FriendRequestDoc);
      merge();
    });
    return () => {
      u1();
      u2();
    };
  }, [uid]);

  const friends = docs.filter((d) => d.status === 'accepted');
  const incoming = docs.filter((d) => d.status === 'pending' && d.to === uid);
  const outgoing = docs.filter((d) => d.status === 'pending' && d.from === uid);
  return { friends, incoming, outgoing };
}
