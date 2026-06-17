export interface Language {
  code: string;
  name: string;
}

// Codes are Google Cloud Translation v2 source/target codes.
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'th', name: 'Thai' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
];

const NAME_BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l.name]));

export function isSupported(code: string): boolean {
  return NAME_BY_CODE.has(code);
}

export function getLanguageName(code: string): string {
  return NAME_BY_CODE.get(code) ?? code;
}
