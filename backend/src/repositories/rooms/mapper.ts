import { DEFAULT_ROOM_COLOR, type Room, type RoomSummary, type RoomVisibility } from '@webchat/shared';

export function toRoom(item: Record<string, unknown> | undefined): Room | null {
  if (!item) return null;
  if (
    typeof item.roomId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.createdAt !== 'string'
  ) {
    return null;
  }
  const visibility: RoomVisibility =
    item.visibility === 'private' ? 'private' : 'public';
  return {
    roomId: item.roomId,
    name: item.name,
    description: typeof item.description === 'string' ? item.description : null,
    password: typeof item.password === 'string' ? item.password : null,
    visibility,
    owner: typeof item.owner === 'string' ? item.owner : null,
    color: typeof item.color === 'string' ? item.color : DEFAULT_ROOM_COLOR,
    createdAt: item.createdAt,
    memberCount: typeof item.memberCount === 'number' ? item.memberCount : 0,
  };
}

export function toRoomSummary(
  item: Record<string, unknown> | undefined,
): RoomSummary | null {
  if (!item) return null;
  if (typeof item.roomId !== 'string' || typeof item.name !== 'string') {
    return null;
  }
  return {
    roomId: item.roomId,
    name: item.name,
    memberCount: typeof item.memberCount === 'number' ? item.memberCount : 0,
  };
}
