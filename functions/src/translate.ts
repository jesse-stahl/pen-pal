import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const GOOGLE_TRANSLATE_API_KEY = defineSecret('GOOGLE_TRANSLATE_API_KEY');

export interface TranslateParams {
  text: string;
  source: string;
  target: string;
}

interface TranslateUrlParams extends TranslateParams {
  apiKey: string;
}

/** Shape of the subset of the Google Translate v2 response we read. */
interface TranslateApiResponse {
  data?: { translations?: Array<{ translatedText?: string }> };
}

export function buildTranslateUrl(p: TranslateUrlParams): string {
  const base = 'https://translation.googleapis.com/language/translate/v2';
  const params = new URLSearchParams({
    key: p.apiKey,
    q: p.text,
    source: p.source,
    target: p.target,
    format: 'text',
  });
  return `${base}?${params.toString()}`;
}

export function parseTranslateResponse(body: TranslateApiResponse): string {
  const t = body?.data?.translations?.[0]?.translatedText;
  if (typeof t !== 'string') throw new Error('Malformed translation response');
  return t;
}

function readParams(data: Partial<TranslateParams> | undefined): TranslateParams {
  const text = data?.text;
  const source = data?.source;
  const target = data?.target;
  if (!text || !source || !target) {
    throw new HttpsError('invalid-argument', 'text, source, target required.');
  }
  return { text, source, target };
}

export const translate = onCall(
  { secrets: [GOOGLE_TRANSLATE_API_KEY], region: 'asia-southeast1' },
  async (request: CallableRequest<Partial<TranslateParams>>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const { text, source, target } = readParams(request.data);

    const url = buildTranslateUrl({ text, source, target, apiKey: GOOGLE_TRANSLATE_API_KEY.value() });
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new HttpsError('internal', `Translate API error: ${res.status}`);
    const body = (await res.json()) as TranslateApiResponse;
    return { translatedText: parseTranslateResponse(body) };
  }
);
