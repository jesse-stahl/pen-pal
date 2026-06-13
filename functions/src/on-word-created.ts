import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { buildExpoMessages, sendExpoPush } from './expo-push';

if (admin.apps.length === 0) admin.initializeApp();

// Minimal shapes of the docs this trigger reads (typed to avoid `any`).
interface WordData {
  createdBy: string;
  terms: Record<string, string>;
}
interface MemberInfo {
  displayName: string;
}
interface ListData {
  name: string;
  memberUids: string[];
  members?: Record<string, MemberInfo>;
}
interface UserData {
  expoPushTokens?: string[];
}

/** Increment the word-trade counter so the author is credited for teaching `partnerUid`. */
async function bumpTrade(db: admin.firestore.Firestore, authorUid: string, partnerUid: string): Promise<void> {
  const pairKey = [authorUid, partnerUid].sort().join('_');
  await db.doc(`trades/${pairKey}`).set(
    {
      pairKey,
      counts: { [authorUid]: admin.firestore.FieldValue.increment(1) },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Collect the Expo push tokens of every member except the author, bumping each trade en route. */
async function collectTokensAndTrade(
  db: admin.firestore.Firestore,
  list: ListData,
  authorUid: string
): Promise<string[]> {
  const others = list.memberUids.filter((uid) => uid !== authorUid);
  const tokens: string[] = [];
  for (const uid of others) {
    const user = (await db.doc(`users/${uid}`).get()).data() as UserData | undefined;
    if (user?.expoPushTokens) tokens.push(...user.expoPushTokens);
    await bumpTrade(db, authorUid, uid);
  }
  return tokens;
}

function nudgeBody(list: ListData, word: WordData): string {
  const authorName = list.members?.[word.createdBy]?.displayName ?? 'Your partner';
  const firstTerm = Object.values(word.terms)[0] ?? '';
  return `${authorName} added "${firstTerm}" to ${list.name}`;
}

export const onWordCreated = onDocumentCreated(
  { document: 'lists/{listId}/words/{wordId}', region: 'us-central1' },
  async (event) => {
    const word = event.data?.data() as WordData | undefined;
    if (!word) return;

    const db = admin.firestore();
    const listSnap = await db.doc(`lists/${event.params.listId}`).get();
    const list = listSnap.data() as ListData | undefined;
    if (!list) return;

    const tokens = await collectTokensAndTrade(db, list, word.createdBy);
    const messages = buildExpoMessages(tokens, 'New word to learn', nudgeBody(list, word), {
      listId: event.params.listId,
    });
    await sendExpoPush(messages);
  }
);
