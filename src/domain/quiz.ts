export interface Card {
  groupId: string;
  prompt: string;
  answer: string;
}

export interface MultipleChoiceQuestion {
  card: Card;
  correct: string;
  options: string[];
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildMultipleChoice(
  card: Card,
  pool: Card[],
  count: number,
  rng: () => number = Math.random
): MultipleChoiceQuestion {
  const distractors = shuffle(
    pool.filter((c) => c.groupId !== card.groupId).map((c) => c.answer),
    rng
  ).slice(0, Math.max(0, count - 1));
  const options = shuffle([card.answer, ...distractors], rng);
  return { card, correct: card.answer, options };
}

export interface MatchingRound {
  prompts: Card[];
  answers: Card[];
}

export function buildMatchingRound(
  pool: Card[],
  size: number,
  rng: () => number = Math.random
): MatchingRound {
  const chosen = shuffle(pool, rng).slice(0, Math.min(size, pool.length));
  return {
    prompts: shuffle(chosen, rng),
    answers: shuffle(chosen, rng),
  };
}
