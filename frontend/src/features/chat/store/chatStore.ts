import { create } from 'zustand';
import type { ChatMessage } from '@webchat/shared';

export type ChatStatus = 'idle' | 'establishing' | 'active' | 'syncing';

interface ChatState {
  status: ChatStatus;
  messages: ChatMessage[];

  start: () => void;
  markEstablishing: () => void;
  markActive: () => void;
  markSyncing: () => void;
  addMessage: (message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  status: 'idle',
  messages: [],

  start: () =>
    set((s) => (s.status === 'idle' ? { status: 'establishing' } : s)),
  markEstablishing: () =>
    set((s) => (s.status === 'idle' ? s : { status: 'establishing' })),
  markActive: () => set({ status: 'active' }),
  markSyncing: () =>
    set((s) => (s.status === 'active' ? { status: 'syncing' } : s)),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
}));
