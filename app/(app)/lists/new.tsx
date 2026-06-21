import { useState, useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useProfile } from '../../../src/store/session';
import { createList } from '../../../src/data/lists';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Button } from '../../../src/ui/components/button';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function NewList() {
  const profile = useProfile();
  const router = useRouter();
  const [name, setName] = useState('');

  useFocusEffect(
    useCallback(() => {
      return () => setName('');
    }, []),
  );

  async function create() {
    if (!name.trim()) return;
    const [langA, langB] = [profile.nativeLang, profile.targetLang].sort();
    const id = await createList({ name: name.trim(), owner: profile, langA, langB });
    router.replace(`/(app)/lists/${id}`);
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        New list
      </AppText>

      <AppText variant="label" color={colors.textMuted} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
        LIST NAME
      </AppText>
      <TextInput
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
          color: colors.text,
          fontFamily: 'Inter_400Regular',
          fontSize: 16,
        }}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Food & Drinks"
        placeholderTextColor={colors.textMuted}
        autoFocus
      />

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Create list" onPress={create} disabled={!name.trim()} />
      </View>
    </Screen>
  );
}
