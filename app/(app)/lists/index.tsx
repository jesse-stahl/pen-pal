import { useState, useMemo } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Plus, UserPlus, Library } from 'lucide-react-native';
import { useProfile } from '../../../src/store/session';
import { useUserLists } from '../../../src/hooks/use-user-lists';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { ListCard } from '../../../src/ui/components/list-card';
import { Button } from '../../../src/ui/components/button';
import { EmptyState } from '../../../src/ui/components/empty-state';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function ListsScreen() {
  const profile = useProfile();
  const { lists } = useUserLists(profile.uid);
  const router = useRouter();
  const [q, setQ] = useState('');

  const filtered = useMemo(
    () => lists.filter((l) => l.name.toLowerCase().includes(q.trim().toLowerCase())),
    [lists, q],
  );

  return (
    <Screen scroll>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Lists
      </AppText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.lg,
          marginTop: spacing.lg,
          marginBottom: spacing.lg,
        }}
      >
        <Icon icon={Search} size={18} color={colors.textMuted} />
        <TextInput
          style={{
            flex: 1,
            paddingVertical: spacing.md,
            color: colors.text,
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
          }}
          placeholder="Search lists"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Button title="New" icon={Plus} onPress={() => router.push('/(app)/lists/new')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Join"
            icon={UserPlus}
            variant="secondary"
            onPress={() => router.push('/(app)/join')}
          />
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Library}
          title={q ? 'No matches' : 'No lists yet'}
          body={q ? 'Try a different search.' : 'Create a list or join one with a code.'}
          actionLabel={q ? undefined : 'Create a list'}
          onAction={q ? undefined : () => router.push('/(app)/lists/new')}
        />
      ) : (
        filtered.map((list) => (
          <ListCard key={list.id} list={list} onPress={() => router.push(`/(app)/lists/${list.id}`)} />
        ))
      )}
    </Screen>
  );
}
