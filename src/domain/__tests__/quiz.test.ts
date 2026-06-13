import { buildMultipleChoice, buildMatchingRound, Card } from '../quiz';

const cards: Card[] = [
  { groupId: 'a', prompt: 'dog', answer: 'หมา' },
  { groupId: 'b', prompt: 'cat', answer: 'แมว' },
  { groupId: 'c', prompt: 'bird', answer: 'นก' },
  { groupId: 'd', prompt: 'fish', answer: 'ปลา' },
  { groupId: 'e', prompt: 'cow', answer: 'วัว' },
];

let seed = 42;
const rng = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

test('multiple choice returns the correct answer plus N-1 distractors, all unique', () => {
  const q = buildMultipleChoice(cards[0], cards, 4, rng);
  expect(q.options).toContain('หมา');
  expect(q.options.length).toBe(4);
  expect(new Set(q.options).size).toBe(4);
  expect(q.correct).toBe('หมา');
});

test('multiple choice with fewer than N cards returns as many as available', () => {
  const q = buildMultipleChoice(cards[0], cards.slice(0, 2), 4, rng);
  expect(q.options.length).toBe(2);
  expect(q.options).toContain('หมา');
});

test('matching round pairs prompts to answers with stable ids', () => {
  const round = buildMatchingRound(cards, 4, rng);
  expect(round.prompts.length).toBe(4);
  expect(round.answers.length).toBe(4);
  // every prompt id has a matching answer id
  const answerIds = new Set(round.answers.map((a) => a.groupId));
  for (const p of round.prompts) expect(answerIds.has(p.groupId)).toBe(true);
});
