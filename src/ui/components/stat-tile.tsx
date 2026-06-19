import { View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './app-text';
import { Icon } from './icon';

export function StatTile({
  icon,
  value,
  label,
  accent = colors.you,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <Icon icon={icon} size={22} color={accent} />
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}
