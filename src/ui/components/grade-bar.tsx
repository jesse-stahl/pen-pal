import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { AppText } from './app-text';

/**
 * SM-2 self-grade buttons shared by flashcard-style modes. Ignores taps while a
 * grade is in flight so a double tap can't grade one card twice and skip the next.
 */
export function GradeBar({ onGrade }: { onGrade: (grade: number) => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function press(g: number) {
    if (busy) return;
    setBusy(true);
    try {
      await onGrade(g);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
      <GradeButton label="Again" color={colors.danger} disabled={busy} onPress={() => press(1)} />
      <GradeButton label="Hard" color={colors.warning} disabled={busy} onPress={() => press(3)} />
      <GradeButton label="Good" color={colors.success} disabled={busy} onPress={() => press(4)} />
      <GradeButton label="Easy" color={colors.partner} disabled={busy} onPress={() => press(5)} />
    </View>
  );
}

interface GradeButtonProps {
  label: string;
  color: string;
  disabled: boolean;
  onPress: () => void;
}

function GradeButton({ label, color, disabled, onPress }: GradeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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
