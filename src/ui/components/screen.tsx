import { ReactNode } from 'react';
import { ScrollView, View, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export function Screen({
  children,
  scroll = false,
  padded = true,
  // Inset top + bottom by default so bottom-anchored content (e.g. study grade
  // buttons, CTAs) never sits under the Android nav bar or iOS home indicator.
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const pad: StyleProp<ViewStyle> = padded ? { paddingHorizontal: spacing.lg } : undefined;

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { paddingBottom: spacing.xxxl + 64, flexGrow: 1 },
            pad,
            contentStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
