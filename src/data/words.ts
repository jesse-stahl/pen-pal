import {
  collection, doc, addDoc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from '@react-native-firebase/firestore';
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

export async function deleteWords(listId: string, wordIds: string[]): Promise<void> {
  for (const id of wordIds) await deleteWord(listId, id);
}

/**
 * Copy words into another list, preserving each word's `groupId` so per-user
 * study progress stays unified across both lists (matches the data model).
 */
export async function copyWordsToList(
  sourceListId: string,
  targetListId: string,
  wordIds: string[],
  byUid: string,
): Promise<void> {
  for (const id of wordIds) {
    const w = await getWord(sourceListId, id);
    if (!w) continue;
    await addDoc(collection(db, 'lists', targetListId, 'words'), {
      groupId: w.groupId, // SAME groupId → unified study progress
      terms: w.terms,
      notes: w.notes,
      createdBy: byUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: byUid,
    });
    await bumpWordCount(targetListId, 1);
  }
}
