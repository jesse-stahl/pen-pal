export interface VoiceInfo {
  language: string;
}

export type VoiceStatus = 'available' | 'missing' | 'unknown';

// Android's java.util.Locale can still report the deprecated ISO 639 codes.
const LEGACY_CODES: Record<string, string> = { in: 'id', iw: 'he', ji: 'yi' };

// "th_TH" / "TH-th" → "th"; "in_ID" → "id"
function primarySubtag(tag: string): string {
  const base = tag.trim().replace(/_/g, '-').toLowerCase().split('-')[0] ?? '';
  return LEGACY_CODES[base] ?? base;
}

/** Whether any installed voice speaks `lang` (a base code like "th" or a tag like "zh-CN"). */
export function hasVoiceFor(voices: VoiceInfo[], lang: string): boolean {
  const base = primarySubtag(lang);
  if (!base) return false;
  return voices.some((v) => primarySubtag(v.language) === base);
}

/**
 * An empty voice list means the engine couldn't report (common on Android right
 * after launch), so we can't claim the voice is missing — report 'unknown'.
 */
export function voiceStatus(voices: VoiceInfo[], lang: string): VoiceStatus {
  if (voices.length === 0) return 'unknown';
  return hasVoiceFor(voices, lang) ? 'available' : 'missing';
}
