import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { Icon } from './icon';
import { ProgressBar } from './progress-bar';

export function StudyHeader({ index, total }: { index: number; total: number }) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
      }}
    >
      <Pressable accessibilityLabel="Exit study" onPress={() => router.back()} hitSlop={12}>
        <Icon icon={X} size={26} color={colors.textMuted} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <ProgressBar value={total === 0 ? 0 : index / total} />
      </View>
    </View>
  );
}
