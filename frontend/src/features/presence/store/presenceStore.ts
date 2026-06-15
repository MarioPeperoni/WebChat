import { create } from 'zustand';

interface PresenceState {
  count: number;
  setCount: (count: number) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
