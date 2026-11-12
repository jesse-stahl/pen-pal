import {
  DocumentReference, DocumentSnapshot, Query, QuerySnapshot,
  getDoc, getDocFromCache, getDocs, getDocsFromCache,
} from '@react-native-firebase/firestore';
import { readCacheFirst } from './cache-read';

/** Cache-first single-document read (see `readCacheFirst`). */
export function getDocCacheFirst(ref: DocumentReference): Promise<DocumentSnapshot> {
  return readCacheFirst(
    () => getDocFromCache(ref),
    () => getDoc(ref),
    (snap) => !snap.exists(),
  );
}

/** Cache-first query read (see `readCacheFirst`). */
export function getDocsCacheFirst(q: Query): Promise<QuerySnapshot> {
  return readCacheFirst(
    () => getDocsFromCache(q),
    () => getDocs(q),
    (snap) => snap.empty,
  );
}
