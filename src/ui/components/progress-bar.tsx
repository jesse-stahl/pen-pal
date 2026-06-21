import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radius, motion } from '../theme';
import { useReducedMotion } from './use-reduced-motion';

export function ProgressBar({
  value, // 0..1
  color = colors.you,
  track = colors.elevated,
  height = 10,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const reduced = useReducedMotion();
  const w = useSharedValue(0);
  useEffect(() => {
    const next = Math.min(1, Math.max(0, value));
    w.value = reduced ? next : withTiming(next, { duration: motion.slow });
  }, [value, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={{ height, backgroundColor: track, borderRadius: radius.pill, overflow: 'hidden' }}>
      <Animated.View style={[{ height, backgroundColor: color, borderRadius: radius.pill }, fill]} />
    </View>
  );
}
