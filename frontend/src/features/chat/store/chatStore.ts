import { create } from 'zustand';
import type { ChatCommandMessage, ChatMessage, CommandResult } from '@webchat/shared';

export type ChatStatus = 'idle' | 'establishing' | 'active' | 'syncing';

interface ChatState {
  status: ChatStatus;
  messages: ChatMessage[];

  start: () => void;
  markEstablishing: () => void;
  markActive: () => void;
  markSyncing: () => void;
  addMessage: (message: ChatMessage) => void;
  addPendingCommand: (commandId: string, prompt: string) => void;
  resolveCommand: (commandId: string, result: CommandResult) => void;
  clearMessages: () => void;
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
  addPendingCommand: (commandId, prompt) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          kind: 'command',
          commandId,
          prompt,
          result: null,
          timestamp: new Date().toISOString(),
        } satisfies ChatCommandMessage,
      ],
    })),
  resolveCommand: (commandId, result) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.kind === 'command' && m.commandId === commandId
          ? { ...m, result }
          : m,
      ),
    })),
  clearMessages: () =>
    set((s) => ({
      messages: s.messages.filter((m) => m.kind === 'command' && m.result === null),
    })),
}));
