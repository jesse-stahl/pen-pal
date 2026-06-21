import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { colors, type } from '../theme';

type Variant = keyof typeof type;

export function AppText({
  variant = 'body',
  color = colors.text,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text {...rest} style={[type[variant], { color }, style]} />;
}
