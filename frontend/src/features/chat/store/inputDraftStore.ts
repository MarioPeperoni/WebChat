import { create } from 'zustand';

interface InputDraftState {
  draft: string | null;
  seq: number;
  setDraft: (draft: string) => void;
  consume: () => void;
}

export const useInputDraftStore = create<InputDraftState>((set) => ({
  draft: null,
  seq: 0,
  setDraft: (draft) => set((s) => ({ draft, seq: s.seq + 1 })),
  consume: () => set({ draft: null }),
}));
