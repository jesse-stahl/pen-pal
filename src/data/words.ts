import {
  collection, doc, addDoc, getDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy, writeBatch, increment,
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

// Atomic bulk delete: one batch so the words and the wordCount decrement commit
// together (no drift if it fails partway).
export async function deleteWords(listId: string, wordIds: string[]): Promise<void> {
  if (wordIds.length === 0) return;
  const batch = writeBatch(db);
  for (const id of wordIds) batch.delete(doc(db, 'lists', listId, 'words', id));
  batch.update(doc(db, 'lists', listId), {
    wordCount: increment(-wordIds.length),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/**
 * Copy words into another list, preserving each word's `groupId` so per-user
 * study progress stays unified across both lists (matches the data model).
 * Source reads happen first, then a single atomic batch writes the copies and
 * the wordCount bump together.
 */
export async function copyWordsToList(
  sourceListId: string,
  targetListId: string,
  wordIds: string[],
  byUid: string,
): Promise<void> {
  const words = (await Promise.all(wordIds.map((id) => getWord(sourceListId, id)))).filter(
    (w): w is WordDoc => w !== null,
  );
  if (words.length === 0) return;

  const batch = writeBatch(db);
  for (const w of words) {
    const ref = doc(collection(db, 'lists', targetListId, 'words'));
    batch.set(ref, {
      groupId: w.groupId, // SAME groupId → unified study progress
      terms: w.terms,
      notes: w.notes,
      createdBy: byUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: byUid,
    });
  }
  batch.update(doc(db, 'lists', targetListId), {
    wordCount: increment(words.length),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
