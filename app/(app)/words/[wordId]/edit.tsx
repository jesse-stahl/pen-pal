import { useEffect, useState } from 'react';
import { View, TextInput, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { Trash2, ChevronLeft } from 'lucide-react-native';
import { db } from '../../../../src/firebase/config';
import { ListDoc, WordDoc } from '../../../../src/firebase/schema';
import { getWord, updateWord, deleteWord } from '../../../../src/data/words';
import { getLanguageName } from '../../../../src/domain/languages';
import { orientLanguages } from '../../../../src/domain/direction';
import { useProfile } from '../../../../src/store/session';
import { Screen } from '../../../../src/ui/components/screen';
import { AppText } from '../../../../src/ui/components/app-text';
import { Card } from '../../../../src/ui/components/card';
import { Button } from '../../../../src/ui/components/button';
import { Icon } from '../../../../src/ui/components/icon';
import { SpeakButton } from '../../../../src/ui/components/speak-button';
import { colors, spacing, radius } from '../../../../src/ui/theme';

export default function EditWord() {
  const { wordId, listId } = useLocalSearchParams<{ wordId: string; listId: string }>();
  const profile = useProfile();
  const router = useRouter();
  const [list, setList] = useState<ListDoc | null>(null);
  const [word, setWord] = useState<WordDoc | null>(null);
  const [nativeText, setNativeText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!listId) return;
    return onSnapshot(doc(db, 'lists', listId), (s) => setList({ id: s.id, ...s.data() } as ListDoc));
  }, [listId]);

  const langs = list ? orientLanguages(list.langA, list.langB, profile.nativeLang) : null;

  useEffect(() => {
    (async () => {
      if (!listId || !wordId || !langs) return;
      const w = await getWord(listId, wordId);
      if (!w) return;
      setWord(w);
      setNativeText(w.terms[langs.nativeLang] ?? '');
      setTargetText(w.terms[langs.targetLang] ?? '');
      setNotes(w.notes ?? '');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, wordId, list?.id]);

  if (!listId || !wordId || !langs || !word) {
    return (
      <Screen>
        <AppText variant="body" color={colors.textMuted}>
          Loading…
        </AppText>
      </Screen>
    );
  }
  const { nativeLang, targetLang } = langs;

  async function save() {
    await updateWord({
      listId,
      wordId,
      terms: { [nativeLang]: nativeText.trim(), [targetLang]: targetText.trim() },
      notes: notes.trim(),
      updatedBy: profile.uid,
    });
    router.back(); // back to the word's view card
  }

  function confirmDelete() {
    Alert.alert('Delete word', 'Remove this word from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWord(listId, wordId);
          router.dismiss(2); // pop edit + view → back to the list
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
        <AppText variant="h1" color={colors.you} style={{ textAlign: 'center' }}>
          {nativeText || '—'}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AppText variant="h2" color={colors.partner} style={{ textAlign: 'center' }}>
            {targetText || '—'}
          </AppText>
          <SpeakButton text={targetText} lang={targetLang} />
        </View>
      </Card>

      <Field label={getLanguageName(nativeLang)} value={nativeText} onChange={setNativeText} />
      <Field label={getLanguageName(targetLang)} value={targetText} onChange={setTargetText} />
      <Field label="Notes" value={notes} onChange={setNotes} multiline />

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button title="Save changes" onPress={save} disabled={!nativeText.trim() || !targetText.trim()} />
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
