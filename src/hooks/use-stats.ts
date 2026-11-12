import { useEffect, useState } from 'react';
import { collection, doc, query, where } from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { getDocCacheFirst, getDocsCacheFirst } from '../data/firestore-read';
import { TradeDoc, UserDoc } from '../firebase/schema';

export interface PartnerTrade {
  partnerUid: string;
  partnerName: string;
  iTaughtThem: number;
  theyTaughtMe: number;
}

export function useStats(profile: UserDoc | null) {
  const [trades, setTrades] = useState<PartnerTrade[]>([]);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      // Only the user's own trades are readable under the security rules, so scope the
      // query to documents that list this uid in `uids` (array-contains).
      const all = await getDocsCacheFirst(
        query(collection(db, 'trades'), where('uids', 'array-contains', profile.uid))
      );
      const mine: PartnerTrade[] = [];
      for (const d of all.docs) {
        const t = d.data() as TradeDoc;
        const [a, b] = t.pairKey.split('_');
        const partnerUid = a === profile.uid ? b : a;
        const partnerSnap = await getDocCacheFirst(doc(db, 'users', partnerUid));
        mine.push({
          partnerUid,
          partnerName: (partnerSnap.data() as UserDoc | undefined)?.displayName ?? 'Partner',
          iTaughtThem: t.counts[profile.uid] ?? 0,
          theyTaughtMe: t.counts[partnerUid] ?? 0,
        });
      }
      setTrades(mine);
    })();
  }, [profile?.uid]);

  return { trades };
}
