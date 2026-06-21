import { useEffect, useState } from 'react';
import { View, TextInput, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import * as Speech from 'expo-speech';
import { Volume2, Trash2, ChevronLeft, CheckSquare, Square } from 'lucide-react-native';
import { db } from '../../../src/firebase/config';
import { ListDoc, WordDoc } from '../../../src/firebase/schema';
import { getWord, updateWord, deleteWord } from '../../../src/data/words';
import { getStudy, setLearned } from '../../../src/data/progress';
import { getLanguageName } from '../../../src/domain/languages';
import { useProfile } from '../../../src/store/session';
import { Screen } from '../../../src/ui/components/screen';
import { AppText } from '../../../src/ui/components/app-text';
import { Card } from '../../../src/ui/components/card';
import { Button } from '../../../src/ui/components/button';
import { Icon } from '../../../src/ui/components/icon';
import { colors, spacing, radius } from '../../../src/ui/theme';

export default function EditWord() {
  const { wordId, listId } = useLocalSearchParams<{ wordId: string; listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const [word, setWord] = useState<WordDoc | null>(null);
  const [nativeText, setNativeText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [notes, setNotes] = useState('');
  const [learned, setLearnedState] = useState(false);

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  // Orient to the viewer's native language: of the list's two languages, show the
  // viewer's native one first (fall back to langA), the other is their target.
  const nativeLangCode = list
    ? [list.langA, list.langB].includes(profile.nativeLang)
      ? profile.nativeLang
      : list.langA
    : '';
  const targetLangCode = list ? (nativeLangCode === list.langA ? list.langB : list.langA) : '';

  useEffect(() => {
    (async () => {
      if (!listId || !wordId || !list) return;
      const w = await getWord(listId, wordId);
      if (w) {
        setWord(w);
        setNativeText(w.terms[nativeLangCode] ?? '');
        setTargetText(w.terms[targetLangCode] ?? '');
        setNotes(w.notes ?? '');
        const st = await getStudy(profile.uid, w.groupId);
        setLearnedState(st?.learned === true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, wordId, list?.id]);

  if (!listId || !wordId || !list || !word) {
    return (
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          Loading…
        </AppText>
      </Screen>
    );
  }

  async function save() {
    await updateWord({
      listId,
      wordId,
      terms: { [nativeLangCode]: nativeText.trim(), [targetLangCode]: targetText.trim() },
      notes: notes.trim(),
      updatedBy: profile.uid,
    });
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Delete word', 'Remove this word from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWord(listId, wordId);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: spacing.sm }}>
        <Icon icon={ChevronLeft} color={colors.textMuted} />
      </Pressable>

      <Card style={{ marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm }}>
        {/* Native term on top (the viewer's own language). */}
        <AppText variant="h1" color={colors.you} style={{ textAlign: 'center' }}>
          {nativeText || '—'}
        </AppText>
        {/* Target term below, with audio spoken in the target (learned) language. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="h2" color={colors.partner} style={{ textAlign: 'center' }}>
            {targetText || '—'}
          </AppText>
          <Pressable
            accessibilityLabel="Read aloud"
            hitSlop={10}
            onPress={() => targetText && Speech.speak(targetText, { language: targetLangCode })}
          >
            <Icon icon={Volume2} size={22} color={colors.partner} />
          </Pressable>
        </View>
      </Card>

      <Field label={getLanguageName(nativeLangCode)} value={nativeText} onChange={setNativeText} />
      <Field label={getLanguageName(targetLangCode)} value={targetText} onChange={setTargetText} />
      <Field label="Notes" value={notes} onChange={setNotes} multiline />

      <Card style={{ marginTop: spacing.lg }}>
        <Pressable
          onPress={async () => {
            const next = !learned;
            setLearnedState(next);
            await setLearned(profile.uid, word.groupId, next);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexShrink: 1, paddingRight: spacing.md }}>
            <AppText variant="body">Mark as fully learned</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Hides it from study; find it under Review.
            </AppText>
          </View>
          <Icon
            icon={learned ? CheckSquare : Square}
            color={learned ? colors.success : colors.textMuted}
          />
        </Pressable>
      </Card>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          title="Save changes"
          onPress={save}
          disabled={!nativeText.trim() || !targetText.trim()}
        />
        <Button title="Delete word" icon={Trash2} variant="danger" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <AppText variant="label" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
        {label.toUpperCase()}
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
          minHeight: multiline ? 88 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
      />
    </View>
  );
}
