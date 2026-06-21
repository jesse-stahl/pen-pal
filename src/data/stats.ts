import { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
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
