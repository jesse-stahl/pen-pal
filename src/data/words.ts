import {
  collection, doc, addDoc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from '../firebase/config';
import { WordDoc } from '../firebase/schema';
import { bumpWordCount } from './lists';

export function listWordsQuery(listId: string) {
  return query(collection(db, 'lists', listId, 'words'), orderBy('createdAt', 'desc'));
}

export async function getWord(listId: string, wordId: string): Promise<WordDoc | null> {
  const snap = await getDoc(doc(db, 'lists', listId, 'words', wordId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as WordDoc) : null;
}

export async function addWord(params: {
  listIds: string[];
  terms: Record<string, string>;
  notes: string;
  createdBy: string;
}): Promise<string> {
  const groupId = Crypto.randomUUID();
  for (const listId of params.listIds) {
    await addDoc(collection(db, 'lists', listId, 'words'), {
      groupId,
      terms: params.terms,
      notes: params.notes,
      createdBy: params.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: params.createdBy,
    });
    await bumpWordCount(listId, 1);
  }
  return groupId;
}

export async function updateWord(params: {
  listId: string;
  wordId: string;
  terms: Record<string, string>;
  notes: string;
  updatedBy: string;
}): Promise<void> {
  // Last-write-wins: no conflict resolution in v1.
  await updateDoc(doc(db, 'lists', params.listId, 'words', params.wordId), {
    terms: params.terms,
    notes: params.notes,
    updatedAt: serverTimestamp(),
    updatedBy: params.updatedBy,
  });
}

export async function deleteWord(listId: string, wordId: string): Promise<void> {
  await deleteDoc(doc(db, 'lists', listId, 'words', wordId));
  await bumpWordCount(listId, -1);
}
