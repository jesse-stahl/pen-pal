import { doc, getDoc } from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { isValidInviteFormat, normalizeInviteCode } from '../domain/invite-code';
import { InviteDoc, UserDoc } from '../firebase/schema';
import { addMember } from './lists';

export type AcceptResult =
  | { ok: true; listId: string }
  | { ok: false; reason: 'invalid' };

// Static codes: the invites/{code} doc maps a code to a list. A non-member can
// read it (they can't read the list doc) to join. No expiry / no use cap.
export async function acceptInvite(rawCode: string, user: UserDoc): Promise<AcceptResult> {
  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteFormat(code)) return { ok: false, reason: 'invalid' };

  const snap = await getDoc(doc(db, 'invites', code));
  if (!snap.exists()) return { ok: false, reason: 'invalid' };
  const { listId } = snap.data() as InviteDoc;

  // Don't read the list doc to detect already-member: Firestore rules forbid
  // non-members from reading lists, so that read would throw and block the join.
  // addMember uses arrayUnion, so re-accepting is harmless and idempotent.
  await addMember(listId, user);
  return { ok: true, listId };
}
