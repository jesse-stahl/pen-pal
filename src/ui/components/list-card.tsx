import { View } from 'react-native';
import { Users, User, UsersRound, LucideIcon } from 'lucide-react-native';
import { ListDoc } from '../../firebase/schema';
import { colors, spacing } from '../theme';
import { Card } from './card';
import { AppText } from './app-text';
import { Icon } from './icon';
import { Pill } from './pill';

function membership(n: number): { label: string; icon: LucideIcon } {
  if (n <= 1) return { label: 'Private', icon: User };
  if (n === 2) return { label: 'Shared', icon: Users };
  return { label: `Group · ${n}`, icon: UsersRound };
}

export function ListCard({ list, onPress }: { list: ListDoc; onPress: () => void }) {
  const m = membership(list.memberUids.length);
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <AppText variant="h3" style={{ flexShrink: 1, paddingRight: spacing.md }}>
          {list.name}
        </AppText>
        <Pill label={m.label} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.sm,
        }}
      >
        <Icon icon={m.icon} size={15} color={colors.textMuted} />
        <AppText variant="caption" color={colors.textMuted}>
          {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
        </AppText>
      </View>
    </Card>
  );
}
