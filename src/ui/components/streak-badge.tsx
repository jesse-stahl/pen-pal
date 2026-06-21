import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import { radius, spacing, gradients, glow, colors } from '../theme';
import { AppText } from './app-text';
import { Icon } from './icon';

export function StreakBadge({ current }: { current: number }) {
  return (
    <LinearGradient
      colors={gradients.flame}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        ...glow(colors.warning),
      }}
    >
      <Icon icon={Flame} size={18} color="#0B0D10" />
      <AppText variant="bodyStrong" color="#0B0D10">
        {current}
      </AppText>
    </LinearGradient>
  );
}
