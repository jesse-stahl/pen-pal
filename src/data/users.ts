import { doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { UserDoc } from '../firebase/schema';
import { userListsQuery } from './lists';
import { getDocCacheFirst } from './firestore-read';

// Cache-first so a cold start offline loads the profile from the phone instantly
// and the auth gate routes into the app instead of stalling on its spinner.
export async function getUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDocCacheFirst(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function createUserIfMissing(params: {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
}): Promise<void> {
  const ref = doc(db, 'users', params.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: params.uid,
    username: '',
    displayName: params.displayName,
    email: params.email,
    photoURL: params.photoURL,
    nativeLang: '',
    targetLang: '',
    expoPushTokens: [],
    createdAt: serverTimestamp(),
    streak: { current: 0, longest: 0, lastStudyDay: '' },
  });
}

export async function setLanguages(uid: string, nativeLang: string, targetLang: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { nativeLang, targetLang });
}

export async function setDisplayName(uid: string, displayName: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { displayName });
  // Propagate to the denormalized membership copies so shared lists / member
  // screens don't show a stale name.
  const lists = await getDocs(userListsQuery(uid));
  await Promise.all(
    lists.docs.map((d) => updateDoc(d.ref, { [`members.${uid}.displayName`]: displayName })),
  );
}
