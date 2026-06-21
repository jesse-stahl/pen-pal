import { Timestamp } from '@react-native-firebase/firestore';

export interface StreakState {
  current: number;
  longest: number;
  lastStudyDay: string; // "YYYY-MM-DD" in user's local tz
}

export interface UserDoc {
  uid: string;
  username: string; // unique, lowercase; '' until set on first login
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
  inviteCode: string; // static 8-char code; owner can refresh (see Phase 6)
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
  learned: boolean;
  prompt: string;
  answer: string;
  sourceListId: string;
}

// invites/{code} maps a static 8-char code → list. Static codes never expire and
// have no use cap; the owner can rotate the code (which deletes the old mapping).
export interface InviteDoc {
  code: string;
  listId: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface TradeDoc {
  pairKey: string;
  uids: string[];
  counts: Record<string, number>;
  updatedAt: Timestamp;
}

// usernames/{username} → reverse lookup for uniqueness + friend search
export interface UsernameDoc {
  uid: string;
}

// friendRequests/{sortedPairId}
export interface FriendRequestDoc {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted';
  fromUsername: string;
  toUsername: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
