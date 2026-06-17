import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

interface TranslateResult {
  translatedText: string;
}

const functions = getFunctions(app, 'asia-southeast1');

export async function translate(params: {
  text: string;
  source: string;
  target: string;
}): Promise<string> {
  const callable = httpsCallable<typeof params, TranslateResult>(functions, 'translate');
  const res = await callable(params);
  return res.data.translatedText;
}
