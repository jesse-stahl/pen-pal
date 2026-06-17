import { create } from 'zustand';
import { UserDoc } from '../firebase/schema';

interface SessionState {
  profile: UserDoc | null;
  setProfile: (p: UserDoc | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));

/**
 * Returns the signed-in user's profile, guaranteed non-null.
 * Every `(app)` screen renders behind the auth gate in `app/_layout.tsx`,
 * so the profile is always present here. Throwing (instead of a non-null
 * assertion) keeps the code free of `!` while staying fully typed.
 */
export function useProfile(): UserDoc {
  const profile = useSession((s) => s.profile);
  if (!profile) {
    throw new Error('useProfile must be used within an authenticated (app) screen');
  }
  return profile;
}
