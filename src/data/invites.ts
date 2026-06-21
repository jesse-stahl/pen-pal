import { doc, getDoc } from '@react-native-firebase/firestore';
import { db } from '../firebase/config';
import { isValidInviteFormat, normalizeInviteCode } from '../domain/invite-code';
import { InviteDoc, ListDoc, UserDoc } from '../firebase/schema';
import { addMember } from './lists';

export type AcceptResult =
  | { ok: true; listId: string }
  | { ok: false; reason: 'invalid' | 'already-member' };

// Static codes: the invites/{code} doc maps a code to a list. A non-member can
// read it (they can't read the list doc) to join. No expiry / no use cap.
export async function acceptInvite(rawCode: string, user: UserDoc): Promise<AcceptResult> {
  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteFormat(code)) return { ok: false, reason: 'invalid' };

  const snap = await getDoc(doc(db, 'invites', code));
  if (!snap.exists()) return { ok: false, reason: 'invalid' };
  const { listId } = snap.data() as InviteDoc;

  const listSnap = await getDoc(doc(db, 'lists', listId));
  const listData = listSnap.data() as ListDoc | undefined;
  if (listData?.memberUids.includes(user.uid)) {
    return { ok: false, reason: 'already-member' };
  }

  await addMember(listId, user);
  return { ok: true, listId };
}
