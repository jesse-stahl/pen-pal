import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { friendRequestId } from '../domain/friends';
import { UserDoc } from '../firebase/schema';
import { findUserByUsername } from './usernames';

export type SendResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'self' | 'exists' };

export async function sendFriendRequest(me: UserDoc, username: string): Promise<SendResult> {
  const target = await findUserByUsername(username);
  if (!target) return { ok: false, reason: 'not-found' };
  if (target.uid === me.uid) return { ok: false, reason: 'self' };

  const id = friendRequestId(me.uid, target.uid);
  const ref = doc(db, 'friendRequests', id);
  if ((await getDoc(ref)).exists()) return { ok: false, reason: 'exists' };

  await setDoc(ref, {
    id,
    from: me.uid,
    to: target.uid,
    status: 'pending',
    fromUsername: me.username,
    toUsername: target.username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}

export async function acceptFriendRequest(id: string): Promise<void> {
  await updateDoc(doc(db, 'friendRequests', id), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });
}

export async function denyFriendRequest(id: string): Promise<void> {
  await deleteDoc(doc(db, 'friendRequests', id));
}
