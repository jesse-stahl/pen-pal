export interface PromptAnswer {
  prompt: string; // shown to the user (their NATIVE language)
  answer: string; // what they must recall (their TARGET language)
}

/**
 * The user always studies toward their target language: we show them the word
 * in their native language and ask them to recall the target-language term.
 */
export function buildPromptAnswer(
  terms: Record<string, string>,
  nativeLang: string,
  targetLang: string
): PromptAnswer | null {
  const prompt = terms[nativeLang];
  const answer = terms[targetLang];
  if (!prompt || !answer) return null;
  return { prompt, answer };
}
