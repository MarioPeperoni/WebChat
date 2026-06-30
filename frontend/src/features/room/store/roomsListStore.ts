import { create } from 'zustand';
import type { RoomSummary } from '@webchat/shared';

interface RoomsListState {
  rooms: RoomSummary[];
  setRooms: (rooms: RoomSummary[]) => void;
}

export const useRoomsListStore = create<RoomsListState>((set) => ({
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
}));
