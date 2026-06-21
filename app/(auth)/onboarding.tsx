import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LANGUAGES } from '../../src/domain/languages';
import { setLanguages } from '../../src/data/users';
import { useAuth } from '../../src/hooks/use-auth';
import { Screen } from '../../src/ui/components/screen';
import { AppText } from '../../src/ui/components/app-text';
import { Button } from '../../src/ui/components/button';
import { Pill } from '../../src/ui/components/pill';
import { colors, spacing } from '../../src/ui/theme';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [nativeLang, setNative] = useState('');
  const [targetLang, setTarget] = useState('');
  const sameError = nativeLang !== '' && nativeLang === targetLang;

  useFocusEffect(
    useCallback(() => {
      return () => {
        setNative('');
        setTarget('');
      };
    }, []),
  );

  async function save() {
    if (!user || !nativeLang || !targetLang || nativeLang === targetLang) return;
    await setLanguages(user.uid, nativeLang, targetLang);
    await refreshProfile();
    router.replace('/(app)/home');
  }

  return (
    <Screen scroll>
      <AppText variant="h1" style={{ marginTop: spacing.xl }}>
        Set up your languages
      </AppText>

      <AppText
        variant="label"
        color={colors.you}
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      >
        I SPEAK (NATIVE)
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {LANGUAGES.map((l) => (
          <Pill
            key={l.code}
            label={l.name}
            active={nativeLang === l.code}
            color={colors.you}
            onPress={() => setNative(l.code)}
          />
        ))}
      </View>

      <AppText
        variant="label"
        color={colors.partner}
        style={{ marginTop: spacing.xl, marginBottom: spacing.md }}
      >
        I&apos;M LEARNING (TARGET)
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {LANGUAGES.map((l) => (
          <Pill
            key={l.code}
            label={l.name}
            active={targetLang === l.code}
            color={colors.partner}
            onPress={() => setTarget(l.code)}
          />
        ))}
      </View>

      {sameError ? (
        <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.lg }}>
          Native and target must be different.
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing.xxl }}>
        <Button
          title="Continue"
          onPress={save}
          disabled={!nativeLang || !targetLang || sameError}
        />
      </View>
    </Screen>
  );
}
