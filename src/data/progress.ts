import {
  collection, doc, getDoc, setDoc, query, where, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { StudyDoc } from '../firebase/schema';
import { SrsState, initialSrs, schedule } from '../domain/srs';
import { nowMs } from '../domain/clock';

function studyRef(uid: string, groupId: string) {
  return doc(db, 'users', uid, 'study', groupId);
}

export async function getStudy(uid: string, groupId: string): Promise<StudyDoc | null> {
  const snap = await getDoc(studyRef(uid, groupId));
  return snap.exists() ? (snap.data() as StudyDoc) : null;
}

/** Ensure a study record exists for this word in the user's direction. */
export async function ensureStudy(params: {
  uid: string;
  groupId: string;
  prompt: string;
  answer: string;
  sourceListId: string;
}): Promise<void> {
  const ref = studyRef(params.uid, params.groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const s = initialSrs(nowMs());
  await setDoc(ref, {
    groupId: params.groupId,
    ease: s.ease,
    intervalDays: s.intervalDays,
    repetitions: s.repetitions,
    dueAt: Timestamp.fromMillis(s.dueAt),
    lastGrade: s.lastGrade,
    lastReviewedAt: Timestamp.fromMillis(0),
    prompt: params.prompt,
    answer: params.answer,
    sourceListId: params.sourceListId,
  } satisfies StudyDoc);
}

/** Apply a grade (0..5) to a study record and persist the new SM-2 state. */
export async function gradeStudy(uid: string, groupId: string, grade: number): Promise<void> {
  const ref = studyRef(uid, groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data() as StudyDoc;
  const prev: SrsState = {
    ease: d.ease,
    intervalDays: d.intervalDays,
    repetitions: d.repetitions,
    dueAt: d.dueAt.toMillis(),
    lastGrade: d.lastGrade,
    lastReviewedAt: d.lastReviewedAt.toMillis(),
  };
  const next = schedule(prev, grade, nowMs());
  await setDoc(ref, {
    ...d,
    ease: next.ease,
    intervalDays: next.intervalDays,
    repetitions: next.repetitions,
    dueAt: Timestamp.fromMillis(next.dueAt),
    lastGrade: next.lastGrade,
    lastReviewedAt: Timestamp.fromMillis(next.lastReviewedAt),
  });
}

export async function getDueStudies(uid: string, now: number, max = 50): Promise<StudyDoc[]> {
  const q = query(
    collection(db, 'users', uid, 'study'),
    where('dueAt', '<=', Timestamp.fromMillis(now))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as StudyDoc).slice(0, max);
}
