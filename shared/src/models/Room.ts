export type RoomVisibility = 'public' | 'private';

export type Room = {
  roomId: string;
  name: string;
  description: string | null;
  password: string | null;
  visibility: RoomVisibility;
  owner: string | null;
  color: string;
  createdAt: string;
  memberCount: number;
};

export const DEFAULT_ROOM_COLOR = '#000000';

export type RoomSummary = Pick<Room, 'roomId' | 'name' | 'memberCount'>;

export const GLOBAL_ROOM_ID = 'global';
