const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O,0,I,1,L

export function generateInviteCode(rng: () => number = Math.random): string {
  const pick = () => ALPHABET[Math.floor(rng() * ALPHABET.length)];
  const block = () => pick() + pick() + pick();
  return `${block()}-${block()}`;
}

export function normalizeInviteCode(input: string): string {
  const raw = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return raw.length === 6 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : raw;
}

export function isValidInviteFormat(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{3}-[${ALPHABET}]{3}$`).test(code);
}
