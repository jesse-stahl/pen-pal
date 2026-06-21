import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, motion, gradients, glow } from '../theme';
import { AppText } from './app-text';
import { Icon } from './icon';
import { useReducedMotion } from './use-reduced-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  full = true,
}: {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = disabled || loading;

  const textColor =
    variant === 'secondary' || variant === 'ghost' || variant === 'danger'
      ? colors.text
      : '#0B0D10';
  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Icon icon={icon} size={20} color={textColor} /> : null}
          <AppText variant="bodyStrong" color={textColor}>
            {title}
          </AppText>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[animStyle, full ? { alignSelf: 'stretch' } : undefined]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPressIn={() => {
          if (!reduced) scale.value = withSpring(0.96, motion.spring);
        }}
        onPressOut={() => {
          if (!reduced) scale.value = withSpring(1, motion.spring);
        }}
        onPress={onPress}
        style={{ opacity: isDisabled ? 0.5 : 1 }}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={gradients.you}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, glow(colors.you)]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[styles.base, variantStyle(variant)]}>{content}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function variantStyle(v: Variant): ViewStyle {
  if (v === 'secondary')
    return { backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.border };
  if (v === 'danger') return { backgroundColor: colors.dangerBright };
  return { backgroundColor: 'transparent' };
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
