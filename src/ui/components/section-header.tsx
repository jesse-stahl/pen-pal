import { ReactNode } from 'react';
import { View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './app-text';

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
        marginBottom: spacing.md,
      }}
    >
      <AppText variant="label" color={colors.textMuted} style={{ textTransform: 'uppercase' }}>
        {title}
      </AppText>
      {action}
    </View>
  );
}
