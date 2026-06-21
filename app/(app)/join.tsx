import { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { acceptInvite } from '../../src/data/invites';
import { useProfile } from '../../src/store/session';
import { Screen } from '../../src/ui/components/screen';
import { AppText } from '../../src/ui/components/app-text';
import { Button } from '../../src/ui/components/button';
import { Icon } from '../../src/ui/components/icon';
import { colors, spacing, radius } from '../../src/ui/theme';

const MESSAGES: Record<string, string> = {
  invalid: 'That code is not valid.',
  expired: 'That invite has expired.',
  exhausted: 'That invite has been used too many times.',
  'already-member': 'You are already in this list.',
};

export default function Join() {
  const profile = useProfile();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function join() {
    setError('');
    const res = await acceptInvite(code, profile);
    if (res.ok) router.replace(`/(app)/lists/${res.listId}`);
    else setError(MESSAGES[res.reason]);
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Join a list
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        Enter the invite code your partner shared.
      </AppText>

      <TextInput
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginTop: spacing.xl,
          color: colors.text,
          fontFamily: 'Inter_700Bold',
          fontSize: 24,
          letterSpacing: 4,
          textAlign: 'center',
        }}
        value={code}
        onChangeText={setCode}
        placeholder="PNK-7Q2"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        autoFocus
      />

      {error ? (
        <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Join list" onPress={join} disabled={!code.trim()} />
      </View>
    </Screen>
  );
}
