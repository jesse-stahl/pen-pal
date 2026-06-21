import { generateInviteCode, isValidInviteFormat, normalizeInviteCode } from '../invite-code';

describe('invite codes (8-char)', () => {
  test('generates an 8-char code from the safe alphabet', () => {
    const code = generateInviteCode(() => 0); // deterministic
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    expect(code).toHaveLength(8);
  });

  test('generated codes never contain ambiguous chars O,0,I,1,L', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode(() => Math.random());
      expect(isValidInviteFormat(code)).toBe(true);
      expect(code).not.toMatch(/[O0I1L]/);
    }
  });

  test('normalize strips separators and uppercases', () => {
    expect(normalizeInviteCode('k7m2-p9qx')).toBe('K7M2P9QX');
    expect(normalizeInviteCode(' K7M2 P9QX ')).toBe('K7M2P9QX');
  });

  test('validates 8-char format', () => {
    expect(isValidInviteFormat('K7M2P9QX')).toBe(true);
    expect(isValidInviteFormat('K7M2P9Q')).toBe(false); // 7 chars
    expect(isValidInviteFormat('K7M2-P9QX')).toBe(false); // separators not allowed post-normalize
  });
});
