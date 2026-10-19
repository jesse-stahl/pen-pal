import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { VoiceStatus, voiceStatus } from '../domain/voice-match';
import { getLanguageName } from '../domain/languages';

// Pronunciation uses the device's built-in text-to-speech. Everything that
// speaks goes through this module so the audio source can be swapped later
// (e.g. for cloud-generated audio) without touching screens.

let cachedVoices: Speech.Voice[] | null = null;

async function loadVoices(): Promise<Speech.Voice[]> {
  if (cachedVoices) return cachedVoices;
  const voices = await Speech.getAvailableVoicesAsync().catch((): Speech.Voice[] => []);
  // Android can report [] before the TTS engine is ready, so only cache a real list.
  if (voices.length > 0) cachedVoices = voices;
  return voices;
}

/** Whether the device can speak `lang`. 'unknown' means "try anyway". */
export async function checkVoice(lang: string): Promise<VoiceStatus> {
  const status = voiceStatus(await loadVoices(), lang);
  // Re-check next time: the user may install the voice while the app is open.
  if (status === 'missing') cachedVoices = null;
  return status;
}

export function showMissingVoiceHint(lang: string): void {
  const name = getLanguageName(lang);
  Alert.alert(
    `No ${name} voice`,
    `This device has no ${name} voice installed. Add one in your phone's text-to-speech settings, then try again.`,
  );
}

/** Speak `text` in `lang`, interrupting anything already playing. */
export async function speak(text: string, lang: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !lang) return;
  if ((await checkVoice(lang)) === 'missing') {
    showMissingVoiceHint(lang);
    return;
  }
  await Speech.stop();
  Speech.speak(trimmed, { language: lang });
}
