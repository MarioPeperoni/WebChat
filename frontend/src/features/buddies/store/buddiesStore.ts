import { create } from 'zustand';
import type { Buddy } from '@webchat/shared';

interface BuddiesState {
  buddies: Buddy[];
  setBuddies: (buddies: Buddy[]) => void;
  addBuddy: (buddy: Buddy) => void;
  removeBuddy: (userId: string) => void;
  setPresence: (userId: string, online: boolean) => void;
  isBuddy: (userId: string) => boolean;
}

export const useBuddiesStore = create<BuddiesState>((set, get) => ({
  buddies: [],
  setBuddies: (buddies) => set({ buddies }),
  addBuddy: (buddy) =>
    set((state) => {
      if (state.buddies.some((b) => b.userId === buddy.userId)) return state;
      return { buddies: [...state.buddies, buddy] };
    }),
  removeBuddy: (userId) =>
    set((state) => ({ buddies: state.buddies.filter((b) => b.userId !== userId) })),
  setPresence: (userId, online) =>
    set((state) => ({
      buddies: state.buddies.map((b) =>
        b.userId === userId ? { ...b, online } : b,
      ),
    })),
  isBuddy: (userId) => get().buddies.some((b) => b.userId === userId),
}));
