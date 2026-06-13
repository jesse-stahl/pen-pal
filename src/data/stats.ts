import { doc, getDoc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserDoc } from '../firebase/schema';
import { applyStudyDay } from '../domain/streak';
import { todayKey } from '../domain/clock';

export async function recordStudyDay(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const user = snap.data() as UserDoc;
  const next = applyStudyDay(user.streak, todayKey());
  await updateDoc(ref, { streak: next });
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('_');
}

/** Increment the trade counter: `contributorUid` taught `partnerUid` a word. */
export async function recordTrade(contributorUid: string, partnerUid: string): Promise<void> {
  const key = pairKey(contributorUid, partnerUid);
  const ref = doc(db, 'trades', key);
  await setDoc(
    ref,
    { pairKey: key, counts: { [contributorUid]: increment(1) }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
