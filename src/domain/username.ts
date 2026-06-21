export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(input: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(input);
}
