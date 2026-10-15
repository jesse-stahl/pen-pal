import { View, Pressable } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { speak } from '../../services/speech';
import { colors, spacing, radius } from '../theme';
import { AppText } from './app-text';
import { Card } from './card';
import { Icon } from './icon';
import { SpeakButton } from './speak-button';

interface ListeningCardProps {
  flipped: boolean;
  prompt: string; // native-language translation (revealed on the back)
  answer: string; // target-language word (what is spoken)
  lang: string; // target language code
  onFlip: () => void;
}

/** Front: tap-to-play audio only. Back: native translation, target spelling, replay. */
export function ListeningCard({ flipped, prompt, answer, lang, onFlip }: ListeningCardProps) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onFlip}>
      <Card
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: flipped ? colors.partner : colors.you,
          borderWidth: 1.5,
          borderRadius: radius.xl,
        }}
      >
        {flipped ? <Back prompt={prompt} answer={answer} lang={lang} /> : <Front answer={answer} lang={lang} />}
      </Card>
    </Pressable>
  );
}

function Front({ answer, lang }: { answer: string; lang: string }) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play word"
        onPress={() => {
          void speak(answer, lang);
        }}
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: colors.elevated,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={Volume2} size={56} color={colors.you} />
      </Pressable>
      <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.lg }}>
        Tap the speaker to listen, then tap the card to reveal
      </AppText>
    </>
  );
}

function Back({ prompt, answer, lang }: { prompt: string; answer: string; lang: string }) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <AppText variant="h1" color={colors.you} style={{ textAlign: 'center', fontSize: 40, lineHeight: 46 }}>
        {prompt}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText variant="body" color={colors.partner}>
          {answer}
        </AppText>
        <SpeakButton text={answer} lang={lang} />
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        How well did you know it?
      </AppText>
    </View>
  );
}
