import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { PartyPopper, Sparkles, Target, RotateCcw, Home } from 'lucide-react-native';
import { useStudySession } from '../../../src/store/study-session';
import { summarize } from '../../../src/domain/session-result';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Button } from '../../../src/ui/components/button';
import { StatTile } from '../../../src/ui/components/stat-tile';
import { ProgressRing } from '../../../src/ui/components/progress-ring';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing } from '../../../src/ui/theme';

export default function Results() {
  const router = useRouter();
  const { session, mode, listId, clear } = useStudySession();

  const summary = session ? summarize(session) : null;
  const caughtUp = !summary || summary.answered === 0;
  const accent = caughtUp ? colors.partner : summary.accuracy >= 80 ? colors.success : colors.you;

  function replay() {
    if (!mode) return;
    clear();
    // listId is the 'all' sentinel for an All-lists session; replay without a
    // listId so the deck spans every list again instead of a list named "all".
    const target =
      listId && listId !== 'all'
        ? `/(app)/study/${mode}?listId=${listId}`
        : `/(app)/study/${mode}`;
    router.replace(target);
  }
  function done() {
    clear();
    router.replace('/(app)/play');
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', marginTop: spacing.xxxl }}>
        <ProgressRing size={140} value={caughtUp ? 1 : summary.accuracy / 100} color={accent}>
          <Icon icon={caughtUp ? Sparkles : PartyPopper} size={44} color={accent} />
        </ProgressRing>
        <AppText variant="h1" style={{ marginTop: spacing.xl, textAlign: 'center' }}>
          {caughtUp ? 'All caught up!' : 'Session complete'}
        </AppText>
        <AppText
          variant="body"
          color={colors.textMuted}
          style={{ marginTop: spacing.xs, textAlign: 'center' }}
        >
          {caughtUp ? 'Nothing due right now — come back later.' : `+${summary.xp} XP earned`}
        </AppText>
      </View>

      {!caughtUp ? (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl }}>
            <StatTile icon={Target} value={`${summary.accuracy}%`} label="Accuracy" accent={accent} />
            <StatTile
              icon={Sparkles}
              value={`${summary.correct}/${summary.answered}`}
              label="Correct"
              accent={colors.partner}
            />
          </View>

          {summary.mistakes.length > 0 ? (
            <Card style={{ marginTop: spacing.xl }}>
              <AppText variant="label" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
                REVIEW THESE
              </AppText>
              {summary.mistakes.map((m, idx) => (
                <View
                  key={`${m.answer}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: spacing.sm,
                  }}
                >
                  <AppText variant="body" color={colors.you}>
                    {m.prompt || '—'}
                  </AppText>
                  <AppText variant="bodyStrong" color={colors.partner}>
                    {m.answer}
                  </AppText>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}

      <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
        {!caughtUp && mode && listId ? (
          <Button title="Play again" icon={RotateCcw} onPress={replay} />
        ) : null}
        <Button title="Done" icon={Home} variant="secondary" onPress={done} />
      </View>
    </Screen>
  );
}
