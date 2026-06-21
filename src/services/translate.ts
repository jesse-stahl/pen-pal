import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

interface TranslateParams {
  text: string;
  source: string;
  target: string;
}

interface TranslateResult {
  translatedText: string;
}

// The translate callable lives in asia-southeast1 (same region as the functions
// deploy). httpsCallable keeps the Google Translate API key server-side.
const functions = getFunctions(getApp(), 'asia-southeast1');

export async function translate(params: TranslateParams): Promise<string> {
  const callable = httpsCallable<TranslateParams, TranslateResult>(functions, 'translate');
  const res = await callable(params);
  return res.data.translatedText;
}
