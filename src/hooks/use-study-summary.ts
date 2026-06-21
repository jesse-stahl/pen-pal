import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { StudyDoc } from '../firebase/schema';
import { nowMs } from '../domain/clock';

export interface StudySummary {
  knownCount: number; // study records reviewed at least once
  dueCount: number;
  loading: boolean;
}

export function useStudySummary(uid: string): StudySummary {
  const [summary, setSummary] = useState<StudySummary>({
    knownCount: 0,
    dueCount: 0,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const snap = await getDocs(collection(db, 'users', uid, 'study'));
      const docs = snap.docs.map((d) => d.data() as StudyDoc);
      const known = docs.filter((d) => d.repetitions > 0).length;
      const due = docs.filter((d) => d.dueAt.toMillis() <= nowMs()).length;
      if (active) setSummary({ knownCount: known, dueCount: due, loading: false });
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  return summary;
}
