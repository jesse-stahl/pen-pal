import { View, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { AppText } from './app-text';

/** SM-2 self-grade buttons shared by flashcard-style modes. */
export function GradeBar({ onGrade }: { onGrade: (grade: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
      <GradeButton label="Again" color={colors.danger} onPress={() => onGrade(1)} />
      <GradeButton label="Hard" color={colors.warning} onPress={() => onGrade(3)} />
      <GradeButton label="Good" color={colors.success} onPress={() => onGrade(4)} />
      <GradeButton label="Easy" color={colors.partner} onPress={() => onGrade(5)} />
    </View>
  );
}

function GradeButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color,
        paddingVertical: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
      }}
    >
      <AppText variant="caption" color="#0B0D10">
        {label}
      </AppText>
    </Pressable>
  );
}
