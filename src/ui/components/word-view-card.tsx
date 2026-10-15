import { View, Pressable } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { AppText } from './app-text';
import { Card } from './card';
import { Icon } from './icon';
import { SpeakButton } from './speak-button';

interface WordViewCardProps {
  nativeTerm: string;
  targetTerm: string;
  targetLang: string;
  notes: string;
  learned: boolean;
  onToggleLearned: () => void;
}

/** Read-only presentation of one word: terms, pronunciation, notes, learned toggle. */
export function WordViewCard(props: WordViewCardProps) {
  const { nativeTerm, targetTerm, targetLang, notes, learned, onToggleLearned } = props;
  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
        <AppText variant="h1" color={colors.you} style={{ textAlign: 'center' }}>
          {nativeTerm || '—'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="h2" color={colors.partner} style={{ textAlign: 'center' }}>
            {targetTerm || '—'}
          </AppText>
          <SpeakButton text={targetTerm} lang={targetLang} />
        </View>
      </Card>

      {notes ? (
        <Card>
          <AppText variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
            NOTES
          </AppText>
          <AppText variant="body">{notes}</AppText>
        </Card>
      ) : null}

      <LearnedToggle learned={learned} onPress={onToggleLearned} />
    </View>
  );
}

function LearnedToggle({ learned, onPress }: { learned: boolean; onPress: () => void }) {
  return (
    <Card>
      <Pressable
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flexShrink: 1, paddingRight: spacing.md }}>
          <AppText variant="body">Mark as fully learned</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Hides it from study; find it under Review.
          </AppText>
        </View>
        <Icon icon={learned ? CheckSquare : Square} color={learned ? colors.success : colors.textMuted} />
      </Pressable>
    </Card>
  );
}
