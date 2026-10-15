import { create } from 'zustand';
import { AnswerLog, StudySession, emptySession, logAnswer } from '../domain/session-result';

export type StudyMode = 'flashcards' | 'multiple-choice' | 'typing' | 'matching' | 'listening';

interface StudySessionState {
  session: StudySession | null;
  mode: StudyMode | null;
  listId: string | null;
  start: (total: number, mode: StudyMode, listId: string) => void;
  log: (entry: AnswerLog) => void;
  clear: () => void;
}

export const useStudySession = create<StudySessionState>((set) => ({
  session: null,
  mode: null,
  listId: null,
  start: (total, mode, listId) => set({ session: emptySession(total), mode, listId }),
  log: (entry) => set((s) => (s.session ? { session: logAnswer(s.session, entry) } : s)),
  clear: () => set({ session: null, mode: null, listId: null }),
}));
