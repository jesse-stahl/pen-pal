import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { AppText } from './app-text';
import { Icon } from './icon';

/**
 * The signature element: native term (purple = you) and target term (cyan = partner),
 * meeting in the middle. Used in list rows and word detail.
 */
export function WordPair({
  native,
  target,
  size = 'md',
}: {
  native: string;
  target: string;
  size?: 'md' | 'lg';
}) {
  const variant = size === 'lg' ? 'h2' : 'bodyStrong';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <AppText variant={variant} color={colors.you} style={{ flexShrink: 1 }}>
        {native}
      </AppText>
      <Icon icon={ArrowRight} size={16} color={colors.textMuted} />
      <AppText variant={variant} color={colors.partner} style={{ flexShrink: 1 }}>
        {target}
      </AppText>
    </View>
  );
}
