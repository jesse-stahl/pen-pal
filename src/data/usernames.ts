import {
  doc, getDoc, runTransaction,
} from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { UsernameDoc, UserDoc } from '../firebase/schema';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', username));
  return !snap.exists();
}

/** Atomically reserve a username and write it onto the user doc. */
export async function claimUsername(uid: string, username: string): Promise<boolean> {
  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, 'usernames', username);
      const existing = await tx.get(ref);
      if (existing.exists()) throw new Error('taken');
      tx.set(ref, { uid } satisfies UsernameDoc);
      tx.update(doc(db, 'users', uid), { username });
    });
    return true;
  } catch {
    return false;
  }
}

export async function findUserByUsername(username: string): Promise<UserDoc | null> {
  const reverse = await getDoc(doc(db, 'usernames', username));
  if (!reverse.exists()) return null;
  const uid = (reverse.data() as UsernameDoc).uid;
  const user = await getDoc(doc(db, 'users', uid));
  return user.exists() ? (user.data() as UserDoc) : null;
}
