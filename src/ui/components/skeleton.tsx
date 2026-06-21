import { useEffect } from 'react';
import { DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '../theme';
import { useReducedMotion } from './use-reduced-motion';

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = radius.md,
}: {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}) {
  const reduced = useReducedMotion();
  const o = useSharedValue(0.4);
  useEffect(() => {
    if (reduced) {
      o.value = 0.6;
      return;
    }
    o.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  }, [reduced]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.elevated }, style]}
    />
  );
}
