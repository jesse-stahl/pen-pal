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

export interface DisplayPair {
  nativeTerm: string; // shown on top (viewer's native language)
  targetTerm: string; // shown below (language being learned)
  audioTerm: string;  // spoken aloud — always the target term
  audioLang: string;  // language code for speech synthesis
}

/**
 * Orient a word for display to a specific viewer: their NATIVE term on top,
 * the TARGET (non-native) term below, and audio pronounces the target term.
 */
export function buildDisplayPair(
  terms: Record<string, string>,
  nativeLang: string,
  targetLang: string
): DisplayPair | null {
  const nativeTerm = terms[nativeLang];
  const targetTerm = terms[targetLang];
  if (!nativeTerm || !targetTerm) return null;
  return { nativeTerm, targetTerm, audioTerm: targetTerm, audioLang: targetLang };
}
