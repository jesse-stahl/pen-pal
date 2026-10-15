import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { checkVoice } from '../services/speech';
import { VoiceStatus } from '../domain/voice-match';

/** Whether the device can speak `lang`; null while the first check is in flight. */
export function useVoiceStatus(lang: string): VoiceStatus | null {
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  useEffect(() => {
    let active = true;
    const run = () => {
      checkVoice(lang).then((s) => {
        if (active) setStatus(s);
      });
    };
    run();
    // Re-check on returning to the app: the user may have just installed a voice in settings.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [lang]);
  return status;
}
