import { useState } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

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

  async function autoTranslate(from: 'A' | 'B') {
    setBusy(true);
    try {
      if (from === 'A' && a.trim()) {
        setB(await translate({ text: a.trim(), source: langA, target: langB }));
      } else if (from === 'B' && b.trim()) {
        setA(await translate({ text: b.trim(), source: langB, target: langA }));
      }
    } catch {
      Alert.alert('Translation failed', 'You can still type it manually.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!a.trim() || !b.trim()) return;
    await addWord({
      listIds: [listId],
      terms: { [langA]: a.trim(), [langB]: b.trim() },
      notes: notes.trim(),
      createdBy: profile.uid,
    });
    router.back();
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
        label={getLanguageName(langA)}
        accent={colors.you}
        value={a}
        onChange={setA}
        onTranslate={() => autoTranslate('A')}
        busy={busy}
        autoFocus
      />
      <TranslatableField
        label={getLanguageName(langB)}
        accent={colors.partner}
        value={b}
        onChange={setB}
        onTranslate={() => autoTranslate('B')}
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
        <Button title="Save word" onPress={save} loading={busy} disabled={!a.trim() || !b.trim()} />
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
          <Icon icon={Sparkles} size={20} color={accent} />
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
