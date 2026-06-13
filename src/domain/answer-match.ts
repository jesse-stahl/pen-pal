export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:"'()¿¡]/g, '')
    .replace(/\s+/g, ' ');
}

// Damerau–Levenshtein (optimal string alignment): like Levenshtein but counts an
// adjacent transposition (e.g. "dog" -> "dgo") as a single edit, since transpositions
// are among the most common typos.
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

// Latin script gets fuzzy tolerance; non-latin requires exact normalized match,
// because edit distance on complex scripts (Thai, CJK) is unreliable.
function isLatin(s: string): boolean {
  return /^[\x00-\x7FÀ-ɏ\s]*$/.test(s);
}

/**
 * `expected` may contain several acceptable answers separated by `/` or `,`.
 */
export function isAcceptable(expected: string, given: string): boolean {
  const candidates = expected
    .split(/[/,]/)
    .map(normalize)
    .filter(Boolean);
  const g = normalize(given);
  if (!g) return false;

  for (const c of candidates) {
    if (c === g) return true;
    if (isLatin(c) && isLatin(g)) {
      const dist = editDistance(c, g);
      const tolerance = c.length <= 4 ? 1 : c.length <= 8 ? 2 : 3;
      if (dist <= tolerance) return true;
    }
  }
  return false;
}
