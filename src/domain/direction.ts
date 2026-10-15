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

export interface ListLanguages {
  nativeLang: string; // the viewer's own language within this list
  targetLang: string; // the other language of the list
}

/**
 * Orient a list's two languages to a viewer: their native one first (falling
 * back to langA when they speak neither), the other is their target.
 */
export function orientLanguages(langA: string, langB: string, viewerNative: string): ListLanguages {
  const nativeLang = [langA, langB].includes(viewerNative) ? viewerNative : langA;
  return { nativeLang, targetLang: nativeLang === langA ? langB : langA };
}
