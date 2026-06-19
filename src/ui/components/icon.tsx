import { LucideIcon } from 'lucide-react-native';
import { colors } from '../theme';

export function Icon({
  icon: Glyph,
  size = 22,
  color = colors.text,
  strokeWidth = 2,
}: {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}
