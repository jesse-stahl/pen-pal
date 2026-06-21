import { create } from 'zustand';

interface SelectionState {
  selecting: boolean;
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  enter: (id: string) => void;
  clear: () => void;
}

// Drives multi-select on the list detail screen. `selecting` turns on the
// selection UI; `enter` starts a selection from a long-press.
export const useWordSelection = create<SelectionState>((set) => ({
  selecting: false,
  selectedIds: new Set(),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next, selecting: next.size > 0 };
    }),
  enter: (id) => set({ selecting: true, selectedIds: new Set([id]) }),
  clear: () => set({ selecting: false, selectedIds: new Set() }),
}));
