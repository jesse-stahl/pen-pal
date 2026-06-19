import { ViewStyle } from 'react-native';

export const shadows: Record<'card' | 'floating', ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
};

/** Colored glow used sparingly on the primary CTA / streak. */
export function glow(color: string): ViewStyle {
  return {
    shadowColor: color,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  };
}
