import { create } from 'zustand';
import type { UserPublic } from '@webchat/shared';

interface IdentityState {
  user: UserPublic | null;
  setUser: (user: UserPublic) => void;
  reset: () => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  reset: () => set({ user: null }),
}));
