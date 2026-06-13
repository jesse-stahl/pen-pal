export type InviteError = 'invalid' | 'expired' | 'exhausted' | 'already-member';

/**
 * The subset of an invite needed to validate it. `expiresAt` is typed structurally
 * (anything with `toMillis()`, which a Firestore `Timestamp` satisfies) so this
 * module stays pure — no Firebase import — and easy to unit-test.
 */
export interface InviteLimits {
  active: boolean;
  uses: number;
  maxUses: number;
  expiresAt: { toMillis(): number };
}

/** Validate an invite against expiry/usage limits. Pure, short, testable. */
export function checkInvite(invite: InviteLimits, atMs: number): InviteError | null {
  if (!invite.active) return 'expired';
  if (invite.expiresAt.toMillis() < atMs) return 'expired';
  if (invite.uses >= invite.maxUses) return 'exhausted';
  return null;
}
