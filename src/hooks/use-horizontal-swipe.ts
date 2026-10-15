import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, PanResponderInstance } from 'react-native';

export type SwipeDirection = 'next' | 'prev';

const ACTIVATE_DX = 12; // px of horizontal travel before we claim the gesture
const SWIPE_DX = 60; // px of travel that counts as a swipe on release

/**
 * Detects a horizontal swipe without a native gesture library. Only claims
 * clearly-horizontal moves, so vertical scrolling and taps keep working.
 * Swipe left = 'next', swipe right = 'prev'.
 */
export function useHorizontalSwipe(onSwipe: (dir: SwipeDirection) => void): PanResponderInstance {
  const handler = useRef(onSwipe);
  useEffect(() => {
    handler.current = onSwipe;
  });
  // The ref is only read inside gesture callbacks, never during render; the
  // react-hooks/refs rule can't see that through PanResponder.create.
  return useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > ACTIVATE_DX && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_e, g) => {
          if (g.dx <= -SWIPE_DX) handler.current('next');
          else if (g.dx >= SWIPE_DX) handler.current('prev');
        },
      }),
    [],
  );
}
