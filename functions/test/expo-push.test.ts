import { buildExpoMessages } from '../src/expo-push';

test('builds one message per token with title and body', () => {
  const msgs = buildExpoMessages(['ExponentPushToken[a]', 'ExponentPushToken[b]'], 'Title', 'Body', { listId: 'L1' });
  expect(msgs).toHaveLength(2);
  expect(msgs[0]).toMatchObject({ to: 'ExponentPushToken[a]', title: 'Title', body: 'Body', data: { listId: 'L1' } });
});

test('filters out invalid tokens', () => {
  const msgs = buildExpoMessages(['bad', 'ExponentPushToken[ok]'], 'T', 'B', {});
  expect(msgs).toHaveLength(1);
  expect(msgs[0].to).toBe('ExponentPushToken[ok]');
});
