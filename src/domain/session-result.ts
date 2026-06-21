export interface AnswerLog {
  prompt: string;
  answer: string;
  correct: boolean;
}

export interface StudySession {
  total: number;
  logs: AnswerLog[];
}

export interface SessionSummary {
  total: number;
  answered: number;
  correct: number;
  accuracy: number; // 0..100, integer
  mistakes: AnswerLog[];
  xp: number;
}

const XP_PER_CORRECT = 10;
const PERFECT_BONUS = 20;

export function emptySession(total: number): StudySession {
  return { total, logs: [] };
}

export function logAnswer(session: StudySession, entry: AnswerLog): StudySession {
  return { ...session, logs: [...session.logs, entry] };
}

export function summarize(session: StudySession): SessionSummary {
  const answered = session.logs.length;
  const correct = session.logs.filter((l) => l.correct).length;
  const mistakes = session.logs.filter((l) => !l.correct);
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const perfect = answered > 0 && correct === answered;
  const xp = correct * XP_PER_CORRECT + (perfect ? PERFECT_BONUS : 0);
  return { total: session.total, answered, correct, accuracy, mistakes, xp };
}
