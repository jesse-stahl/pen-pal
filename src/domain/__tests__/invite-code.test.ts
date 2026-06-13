import { generateInviteCode, isValidInviteFormat, normalizeInviteCode } from '../invite-code';

test('generated code matches XXX-XXX format with unambiguous charset', () => {
  for (let i = 0; i < 100; i++) {
    const code = generateInviteCode(() => Math.random());
    expect(isValidInviteFormat(code)).toBe(true);
    expect(code).not.toMatch(/[O0I1L]/); // ambiguous chars excluded
  }
});

test('normalize uppercases and inserts the dash', () => {
  expect(normalizeInviteCode('pnk7q2')).toBe('PNK-7Q2');
  expect(normalizeInviteCode('pnk-7q2')).toBe('PNK-7Q2');
  expect(normalizeInviteCode(' Pnk 7Q2 ')).toBe('PNK-7Q2');
});

test('invalid formats are rejected', () => {
  expect(isValidInviteFormat('AB-123')).toBe(false);
  expect(isValidInviteFormat('ABCD-123')).toBe(false);
  expect(isValidInviteFormat('PNK-7Q2')).toBe(true);
});
