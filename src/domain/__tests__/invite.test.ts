import { checkInvite, InviteLimits } from '../invite';

const base: InviteLimits = { active: true, uses: 0, maxUses: 10, expiresAt: { toMillis: () => 2_000 } };

test('valid invite returns null', () => {
  expect(checkInvite(base, 1_000)).toBeNull();
});
test('expired invite', () => {
  expect(checkInvite({ ...base, expiresAt: { toMillis: () => 500 } }, 1_000)).toBe('expired');
});
test('exhausted invite', () => {
  expect(checkInvite({ ...base, uses: 10 }, 1_000)).toBe('exhausted');
});
test('inactive invite is treated as expired', () => {
  expect(checkInvite({ ...base, active: false }, 1_000)).toBe('expired');
});
