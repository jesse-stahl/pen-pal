import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateInviteCode, isValidInviteFormat, normalizeInviteCode } from '../domain/invite-code';
import { checkInvite, InviteError } from '../domain/invite';
import { nowMs } from '../domain/clock';
import { InviteDoc, UserDoc } from '../firebase/schema';
import { addMember } from './lists';

const SEVEN_DAYS_MS = 7 * 86400000;

export async function createInvite(listId: string, createdBy: string): Promise<string> {
  // retry until an unused code id is found
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const ref = doc(db, 'invites', code);
    const existing = await getDoc(ref);
    if (existing.exists()) continue;
    await setDoc(ref, {
      code,
      listId,
      createdBy,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(nowMs() + SEVEN_DAYS_MS),
      maxUses: 10,
      uses: 0,
      active: true,
    });
    return code;
  }
  throw new Error('Could not allocate invite code, try again.');
}

export type AcceptResult =
  | { ok: true; listId: string }
  | { ok: false; reason: InviteError };

async function isAlreadyMember(listId: string, uid: string): Promise<boolean> {
  const listSnap = await getDoc(doc(db, 'lists', listId));
  if (!listSnap.exists()) return false;
  return (listSnap.data().memberUids as string[]).includes(uid);
}

export async function acceptInvite(rawCode: string, user: UserDoc): Promise<AcceptResult> {
  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteFormat(code)) return { ok: false, reason: 'invalid' };

  const ref = doc(db, 'invites', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: 'invalid' };

  const invite = snap.data() as InviteDoc;
  const problem = checkInvite(invite, nowMs());
  if (problem) return { ok: false, reason: problem };
  if (await isAlreadyMember(invite.listId, user.uid)) {
    return { ok: false, reason: 'already-member' };
  }

  await addMember(invite.listId, user);
  await updateDoc(ref, { uses: increment(1) });
  return { ok: true, listId: invite.listId };
}
