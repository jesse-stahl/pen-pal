import { useState, useCallback } from 'react';
import { View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { getLanguageName } from '../../../src/domain/languages';
import { translate } from '../../../src/services/translate';
import { addWord } from '../../../src/data/words';
import { useProfile } from '../../../src/store/session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Button } from '../../../src/ui/components/button';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function NewWord() {
  const { listId, langA, langB } = useLocalSearchParams<{
    listId: string;
    langA: string;
    langB: string;
  }>();
  const profile = useProfile();
  const router = useRouter();
  const [nativeText, setNativeText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false); // translation in flight
  const [saving, setSaving] = useState(false); // add-word write in flight

  // Clear the form when the screen loses focus. Expo Router keeps stack screens
  // mounted, so without this the next "Add word" would show the previous entry.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setNativeText('');
        setTargetText('');
        setNotes('');
        setBusy(false);
        setSaving(false);
      };
    }, []),
  );

  // Route params are typed as string but can be missing at runtime; guard once
  // so the rest of the component (and its closures) sees them as defined.
  if (!listId || !langA || !langB) {
    return (
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          Missing list context.
        </AppText>
      </Screen>
    );
  }

  // Orient the form to the viewer's native language: of the list's two languages,
  // the viewer's native one is the top field (fall back to langA), the other target.
  const nativeLangCode = [langA, langB].includes(profile.nativeLang) ? profile.nativeLang : langA;
  const targetLangCode = nativeLangCode === langA ? langB : langA;

  async function autoTranslate(from: 'native' | 'target') {
    setBusy(true);
    try {
      if (from === 'native' && nativeText.trim()) {
        setTargetText(
          await translate({ text: nativeText.trim(), source: nativeLangCode, target: targetLangCode }),
        );
      } else if (from === 'target' && targetText.trim()) {
        setNativeText(
          await translate({ text: targetText.trim(), source: targetLangCode, target: nativeLangCode }),
        );
      }
    } catch {
      Alert.alert('Translation failed', 'You can still type it manually.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (saving || !nativeText.trim() || !targetText.trim()) return;
    setSaving(true);
    try {
      await addWord({
        listIds: [listId],
        terms: { [nativeLangCode]: nativeText.trim(), [targetLangCode]: targetText.trim() },
        notes: notes.trim(),
        createdBy: profile.uid,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>
      <AppText variant="h1" style={{ marginTop: spacing.lg }}>
        Add word
      </AppText>

      <TranslatableField
        label={getLanguageName(nativeLangCode)}
        accent={colors.you}
        value={nativeText}
        onChange={setNativeText}
        onTranslate={() => autoTranslate('native')}
        busy={busy}
        autoFocus
      />
      <TranslatableField
        label={getLanguageName(targetLangCode)}
        accent={colors.partner}
        value={targetText}
        onChange={setTargetText}
        onTranslate={() => autoTranslate('target')}
        busy={busy}
      />

      <AppText variant="label" color={colors.textMuted} style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
        NOTES (OPTIONAL)
      </AppText>
      <TextInput
        style={inputStyle(true)}
        value={notes}
        onChangeText={setNotes}
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <View style={{ marginTop: spacing.xl }}>
        <Button
          title="Save word"
          onPress={save}
          loading={saving}
          disabled={saving || !nativeText.trim() || !targetText.trim()}
        />
      </View>
    </Screen>
  );
}

function TranslatableField({
  label,
  accent,
  value,
  onChange,
  onTranslate,
  busy,
  autoFocus = false,
}: {
  label: string;
  accent: string;
  value: string;
  onChange: (s: string) => void;
  onTranslate: () => void;
  busy: boolean;
  autoFocus?: boolean;
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <AppText variant="label" color={accent} style={{ marginBottom: spacing.sm }}>
        {label.toUpperCase()}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <TextInput
          style={[inputStyle(false), { flex: 1 }]}
          value={value}
          onChangeText={onChange}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
        />
        <Pressable
          accessibilityLabel="Auto-translate"
          disabled={busy}
          onPress={onTranslate}
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.lg,
            backgroundColor: colors.elevated,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {busy ? (
            <ActivityIndicator color={accent} />
          ) : (
            <Icon icon={Sparkles} size={20} color={accent} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function inputStyle(multiline: boolean) {
  return {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    minHeight: multiline ? 88 : undefined,
    textAlignVertical: multiline ? ('top' as const) : ('center' as const),
  };
}
