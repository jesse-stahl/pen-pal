import { useEffect, useState } from 'react';
import { checkVoice } from '../services/speech';
import { VoiceStatus } from '../domain/voice-match';

/** Whether the device can speak `lang`; null while the check is in flight. */
export function useVoiceStatus(lang: string): VoiceStatus | null {
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  useEffect(() => {
    let active = true;
    checkVoice(lang).then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, [lang]);
  return status;
}
