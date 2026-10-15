/** Wrap `index` into [0, length) so paging past either end loops around. */
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}
