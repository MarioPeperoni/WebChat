import { create } from 'zustand';
import type { Room } from '@webchat/shared';

interface RoomState {
  room: Room | null;
  setRoom: (room: Room | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  setRoom: (room) => set({ room }),
}));
