import { useState, useCallback } from 'react';
import { View, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { normalizeUsername, isValidUsername } from '../../src/domain/username';
import { isUsernameAvailable, claimUsername } from '../../src/data/usernames';
import { useAuth } from '../../src/hooks/use-auth';
import { Screen } from '../../src/ui/components/screen';
import { AppText } from '../../src/ui/components/app-text';
import { Button } from '../../src/ui/components/button';
import { colors, spacing, radius } from '../../src/ui/theme';

export default function ChooseUsername() {
  const { user, refreshProfile } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setValue('');
        setError('');
        setBusy(false);
      };
    }, []),
  );

  async function submit() {
    if (busy || !user) return;
    const u = normalizeUsername(value);
    if (!isValidUsername(u)) {
      setError('3–20 lowercase letters, numbers, or underscore.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (!(await isUsernameAvailable(u))) {
        setError('That username is taken.');
        return;
      }
      const ok = await claimUsername(user.uid, u);
      if (!ok) {
        setError('That username was just taken.');
        return;
      }
      // The auth gate routes onward (onboarding or home) once the profile updates.
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="h1" style={{ marginTop: spacing.xxl }}>
        Choose a username
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        This is how friends find you.
      </AppText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
        }}
      >
        <AppText variant="bodyStrong" color={colors.textMuted}>
          @
        </AppText>
        <TextInput
          style={{
            flex: 1,
            paddingVertical: spacing.lg,
            paddingLeft: spacing.xs,
            color: colors.text,
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
          }}
          value={value}
          onChangeText={(t) => setValue(normalizeUsername(t))}
          placeholder="yourname"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          autoFocus
        />
      </View>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.md }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Continue" onPress={submit} loading={busy} disabled={busy || !value.trim()} />
      </View>
    </Screen>
  );
}
