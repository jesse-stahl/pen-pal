import {
  doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { generateInviteCode } from '../domain/invite-code';

// Kept separate from invites.ts (which imports addMember from lists.ts) so that
// lists.ts can generate a code without a circular import.

async function allocateCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateInviteCode();
    const existing = await getDoc(doc(db, 'invites', code));
    if (!existing.exists()) return code;
  }
  throw new Error('Could not allocate invite code, try again.');
}

/** Allocate a code + invites/{code} mapping doc for a list. Returns the code. */
export async function createListCode(listId: string, createdBy: string): Promise<string> {
  const code = await allocateCode();
  await setDoc(doc(db, 'invites', code), {
    code,
    listId,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return code;
}

/** Owner-only rotate: write a new mapping, point the list at it, delete the old. */
export async function refreshListCode(
  listId: string,
  oldCode: string,
  uid: string,
): Promise<string> {
  const code = await allocateCode();
  await setDoc(doc(db, 'invites', code), {
    code,
    listId,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'lists', listId), { inviteCode: code });
  if (oldCode) await deleteDoc(doc(db, 'invites', oldCode));
  return code;
}
