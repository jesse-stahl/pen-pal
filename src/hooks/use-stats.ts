import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
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
      // trades where this user participates: query both orderings via pairKey prefix is awkward,
      // so scan trades containing this uid by checking both halves.
      const all = await getDocs(collection(db, 'trades'));
      const mine: PartnerTrade[] = [];
      for (const d of all.docs) {
        const t = d.data() as TradeDoc;
        const [a, b] = t.pairKey.split('_');
        if (a !== profile.uid && b !== profile.uid) continue;
        const partnerUid = a === profile.uid ? b : a;
        const partnerSnap = await getDoc(doc(db, 'users', partnerUid));
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
