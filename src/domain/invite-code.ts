const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O,0,I,1,L
const CODE_LENGTH = 8;

export function generateInviteCode(rng: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(rng() * ALPHABET.length)];
  }
  return code;
}

export function normalizeInviteCode(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function isValidInviteFormat(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(code);
}
