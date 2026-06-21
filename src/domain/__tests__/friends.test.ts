import { friendRequestId, isIncoming } from '../friends';

test('request id is order-independent and joined by underscore', () => {
  expect(friendRequestId('bbb', 'aaa')).toBe('aaa_bbb');
  expect(friendRequestId('aaa', 'bbb')).toBe('aaa_bbb');
});

test('isIncoming is true when the viewer is the recipient', () => {
  expect(isIncoming({ from: 'x', to: 'me' }, 'me')).toBe(true);
  expect(isIncoming({ from: 'me', to: 'x' }, 'me')).toBe(false);
});
