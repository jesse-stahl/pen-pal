import {
  collection, doc, addDoc, getDoc, updateDoc, deleteDoc, query, where,
  serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ListDoc, ListMemberInfo, UserDoc } from '../firebase/schema';

export function userListsQuery(uid: string) {
  return query(collection(db, 'lists'), where('memberUids', 'array-contains', uid));
}

export async function createList(params: {
  name: string;
  owner: UserDoc;
  langA: string;
  langB: string;
}): Promise<string> {
  const memberInfo: ListMemberInfo = {
    displayName: params.owner.displayName,
    nativeLang: params.owner.nativeLang,
    targetLang: params.owner.targetLang,
  };
  const ref = await addDoc(collection(db, 'lists'), {
    name: params.name,
    ownerUid: params.owner.uid,
    memberUids: [params.owner.uid],
    members: { [params.owner.uid]: memberInfo },
    langA: params.langA,
    langB: params.langB,
    wordCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addMember(listId: string, member: UserDoc): Promise<void> {
  await updateDoc(doc(db, 'lists', listId), {
    memberUids: arrayUnion(member.uid),
    [`members.${member.uid}`]: {
      displayName: member.displayName,
      nativeLang: member.nativeLang,
      targetLang: member.targetLang,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function removeMember(listId: string, uid: string): Promise<void> {
  const ref = doc(db, 'lists', listId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as ListDoc;
  const members = { ...data.members };
  delete members[uid];
  await updateDoc(ref, {
    memberUids: arrayRemove(uid),
    members,
    updatedAt: serverTimestamp(),
  });
}

export async function renameList(listId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'lists', listId), { name, updatedAt: serverTimestamp() });
}

export async function deleteList(listId: string): Promise<void> {
  await deleteDoc(doc(db, 'lists', listId));
}

export function bumpWordCount(listId: string, delta: number) {
  return updateDoc(doc(db, 'lists', listId), {
    wordCount: increment(delta),
    updatedAt: serverTimestamp(),
  });
}
