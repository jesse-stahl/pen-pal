import { ReactNode } from 'react';
import { Pressable, View, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, spacing, shadows, motion } from '../theme';
import { useReducedMotion } from './use-reduced-motion';

export function Card({
  children,
  onPress,
  onLongPress,
  style,
  padded = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: padded ? spacing.lg : 0,
    },
    shadows.card,
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          if (!reduced) scale.value = withSpring(0.98, motion.spring);
        }}
        onPressOut={() => {
          if (!reduced) scale.value = withSpring(1, motion.spring);
        }}
        style={base}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
