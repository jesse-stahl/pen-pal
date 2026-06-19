import { emptySession, logAnswer, summarize } from '../session-result';

test('empty session has the right total and no answers', () => {
  const s = emptySession(5);
  const sum = summarize(s);
  expect(sum.total).toBe(5);
  expect(sum.answered).toBe(0);
  expect(sum.correct).toBe(0);
  expect(sum.accuracy).toBe(0);
  expect(sum.mistakes).toEqual([]);
  expect(sum.xp).toBe(0);
});

test('logs answers and computes accuracy + xp', () => {
  let s = emptySession(2);
  s = logAnswer(s, { prompt: 'dog', answer: 'perro', correct: true });
  s = logAnswer(s, { prompt: 'cat', answer: 'gato', correct: false });
  const sum = summarize(s);
  expect(sum.answered).toBe(2);
  expect(sum.correct).toBe(1);
  expect(sum.accuracy).toBe(50);
  expect(sum.mistakes).toEqual([{ prompt: 'cat', answer: 'gato', correct: false }]);
  // 10 per correct answer; no perfect-run bonus here
  expect(sum.xp).toBe(10);
});

test('perfect run awards a completion bonus', () => {
  let s = emptySession(2);
  s = logAnswer(s, { prompt: 'a', answer: 'A', correct: true });
  s = logAnswer(s, { prompt: 'b', answer: 'B', correct: true });
  const sum = summarize(s);
  expect(sum.accuracy).toBe(100);
  expect(sum.xp).toBe(2 * 10 + 20); // base + perfect bonus
});
