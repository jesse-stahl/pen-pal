import { useState, useCallback } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { normalizeUsername } from '../../../src/domain/username';
import { sendFriendRequest } from '../../../src/data/friends';
import { useProfile } from '../../../src/store/session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Button } from '../../../src/ui/components/button';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

const ERRORS: Record<string, string> = {
  'not-found': 'No user with that username.',
  self: "That's you!",
  exists: 'You already have a request or friendship with them.',
};

export default function AddFriend() {
  const profile = useProfile();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setValue('');
        setError('');
        setSent(false);
        setBusy(false);
      };
    }, []),
  );

  async function send() {
    if (busy) return;
    const u = normalizeUsername(value);
    if (!u) return;
    setBusy(true);
    setError('');
    setSent(false);
    try {
      const res = await sendFriendRequest(profile, u);
      if (res.ok) {
        setSent(true);
        setValue('');
      } else {
        setError(ERRORS[res.reason]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Add a friend
      </AppText>
      <AppText variant="body" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        Send a request by username.
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
          onChangeText={(t) => {
            setValue(normalizeUsername(t));
            setError('');
            setSent(false);
          }}
          placeholder="username"
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
      {sent ? (
        <AppText variant="caption" color={colors.success} style={{ marginTop: spacing.md }}>
          Request sent!
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Send request" onPress={send} loading={busy} disabled={busy || !value.trim()} />
      </View>
    </Screen>
  );
}
