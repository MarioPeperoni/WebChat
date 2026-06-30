import { create } from 'zustand';

export type SidebarTab = 'users' | 'buddies';

const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 480;
const ROOMS_MIN = 60;
const ROOMS_MAX = 600;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

interface SidebarState {
  activeTab: SidebarTab;
  width: number;
  roomsHeight: number;
  setActiveTab: (tab: SidebarTab) => void;
  resizeWidth: (delta: number) => void;
  resizeRoomsHeight: (delta: number) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  activeTab: 'users',
  width: 220,
  roomsHeight: 180,
  setActiveTab: (activeTab) => set({ activeTab }),
  resizeWidth: (delta) =>
    set((s) => ({ width: clamp(s.width + delta, SIDEBAR_MIN, SIDEBAR_MAX) })),
  resizeRoomsHeight: (delta) =>
    set((s) => ({
      roomsHeight: clamp(s.roomsHeight + delta, ROOMS_MIN, ROOMS_MAX),
    })),
}));
