import { Timestamp } from 'firebase/firestore';

export interface StreakState {
  current: number;
  longest: number;
  lastStudyDay: string; // "YYYY-MM-DD" in user's local tz
}

export interface UserDoc {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  nativeLang: string;
  targetLang: string;
  expoPushTokens: string[];
  createdAt: Timestamp;
  streak: StreakState;
}

export interface ListMemberInfo {
  displayName: string;
  nativeLang: string;
  targetLang: string;
}

export interface ListDoc {
  id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  members: Record<string, ListMemberInfo>;
  langA: string;
  langB: string;
  wordCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WordDoc {
  id: string;
  groupId: string;
  terms: Record<string, string>; // keyed by language code
  notes: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface StudyDoc {
  groupId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Timestamp;
  lastGrade: number;
  lastReviewedAt: Timestamp;
  prompt: string;
  answer: string;
  sourceListId: string;
}

export interface InviteDoc {
  code: string;
  listId: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  maxUses: number;
  uses: number;
  active: boolean;
}

export interface TradeDoc {
  pairKey: string;
  counts: Record<string, number>;
  updatedAt: Timestamp;
}
