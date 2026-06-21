import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Layers, ListChecks, Keyboard, Shuffle, LucideIcon } from 'lucide-react-native';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing } from '../../../src/ui/theme';

const MODES: { key: string; label: string; icon: LucideIcon; accent: string }[] = [
  { key: 'flashcards', label: 'Flashcards', icon: Layers, accent: colors.you },
  { key: 'multiple-choice', label: 'Multiple choice', icon: ListChecks, accent: colors.partner },
  { key: 'typing', label: 'Typing', icon: Keyboard, accent: colors.success },
  { key: 'matching', label: 'Matching', icon: Shuffle, accent: colors.warning },
];

export default function PlayHub() {
  const router = useRouter();

  return (
    <Screen scroll>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Play
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        Pick a game, then choose what to study.
      </AppText>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        {MODES.map((m) => (
          <Card key={m.key} onPress={() => router.push(`/(app)/play/${m.key}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.elevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon={m.icon} color={m.accent} />
              </View>
              <AppText variant="bodyStrong">{m.label}</AppText>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
