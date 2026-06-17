import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function savePushToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { expoPushTokens: arrayUnion(token) });
}
