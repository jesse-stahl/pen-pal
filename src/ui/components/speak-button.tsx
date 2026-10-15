import { Pressable } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { speak } from '../../services/speech';
import { colors } from '../theme';
import { Icon } from './icon';

/**
 * Tap-to-hear pronunciation. Safe to nest inside another Pressable (a card,
 * a quiz option): the inner press is handled here and does not trigger the parent.
 */
export function SpeakButton({
  text,
  lang,
  size = 22,
  color = colors.partner,
}: {
  text: string;
  lang: string;
  size?: number;
  color?: string;
}) {
  const disabled = !text.trim() || !lang;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play pronunciation of ${text}`}
      hitSlop={12}
      disabled={disabled}
      onPress={() => {
        void speak(text, lang);
      }}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.6 : 1 })}
    >
      <Icon icon={Volume2} size={size} color={color} />
    </Pressable>
  );
}
