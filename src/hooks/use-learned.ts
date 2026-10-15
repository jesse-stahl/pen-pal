import { useEffect, useState } from 'react';
import { getStudy, setLearned } from '../data/progress';

interface LearnedState {
  groupId: string;
  learned: boolean;
}

/**
 * The viewer's "fully learned" flag for one word. State is keyed by groupId so
 * swiping to another word never briefly shows the previous word's value.
 */
export function useLearned(uid: string, groupId: string | undefined) {
  const [state, setState] = useState<LearnedState | null>(null);

  useEffect(() => {
    if (!groupId) return;
    let active = true;
    getStudy(uid, groupId).then((st) => {
      if (!active) return;
      // Don't clobber an optimistic toggle the user made before the fetch resolved.
      setState((prev) => (prev?.groupId === groupId ? prev : { groupId, learned: st?.learned === true }));
    });
    return () => {
      active = false;
    };
  }, [uid, groupId]);

  const learned = state !== null && state.groupId === groupId && state.learned;

  async function toggle() {
    if (!groupId) return;
    const next = !learned;
    setState({ groupId, learned: next });
    try {
      await setLearned(uid, groupId, next);
    } catch {
      setState({ groupId, learned: !next }); // revert optimistic update on failure
    }
  }

  return { learned, toggle };
}
