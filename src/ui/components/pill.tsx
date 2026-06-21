import { Pressable, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './app-text';

export function Pill({
  label,
  color = colors.textSecondary,
  bg = colors.elevated,
  active = false,
  onPress,
}: {
  label: string;
  color?: string;
  bg?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <View
      style={{
        backgroundColor: active ? color : bg,
        borderRadius: radius.pill,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
        alignSelf: 'flex-start',
      }}
    >
      <AppText variant="caption" color={active ? '#0B0D10' : color}>
        {label}
      </AppText>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}
