import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import {
  DEFAULT_ROOM_COLOR,
  GLOBAL_ROOM_ID,
  type Room,
  type RoomSummary,
  type RoomVisibility,
} from '@webchat/shared';

import type { RoomsRepository } from '@/repositories';
import type { RoomMutationResult, RoomResult } from '@/types';

const GLOBAL_ROOM: Room = {
  roomId: GLOBAL_ROOM_ID,
  name: GLOBAL_ROOM_ID,
  description: 'the default chatroom — everyone lands here',
  password: null,
  visibility: 'public',
  owner: null,
  color: DEFAULT_ROOM_COLOR,
  createdAt: '1970-01-01T00:00:00.000Z',
  memberCount: 0,
};

export class RoomsService {
  constructor(private readonly rooms: RoomsRepository) {}

  isGlobal(roomId: string): boolean {
    return roomId === GLOBAL_ROOM_ID;
  }

  async get(roomId: string): Promise<Room | null> {
    if (this.isGlobal(roomId)) return { ...GLOBAL_ROOM };
    return this.rooms.get(roomId);
  }

  async findRoom(input: string): Promise<Room | null> {
    if (this.isGlobal(input)) return { ...GLOBAL_ROOM };
    const bySlug = await this.rooms.get(input);
    if (bySlug) return bySlug;
    return this.rooms.findByName(input);
  }

  async create(
    roomId: string,
    ownerUserId: string,
    now: string,
  ): Promise<RoomMutationResult> {
    if (this.isGlobal(roomId)) {
      return { ok: false, code: 'global_immutable' };
    }
    try {
      const created = await this.rooms.create({
        roomId,
        name: roomId,
        description: null,
        password: null,
        visibility: 'public',
        owner: ownerUserId,
        color: DEFAULT_ROOM_COLOR,
        createdAt: now,
      });
      return { ok: true, value: created };
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        return { ok: false, code: 'already_exists' };
      }
      throw err;
    }
  }

  async listPublic(): Promise<RoomSummary[]> {
    return this.rooms.listPublic();
  }

  async checkPasswordOk(
    input: string,
    given: string | null,
  ): Promise<RoomMutationResult> {
    const room = await this.findRoom(input);
    if (!room) return { ok: false, code: 'not_found' };
    if (room.password) {
      if (given === null) return { ok: false, code: 'missing_password' };
      if (room.password !== given) return { ok: false, code: 'invalid_password' };
    }
    return { ok: true, value: room };
  }

  async setName(
    roomId: string,
    callerUserId: string,
    newName: string,
  ): Promise<RoomMutationResult> {
    const guard = await this.guardOwner(roomId, callerUserId);
    if (!guard.ok) return guard;
    const updated = await this.rooms.setName(roomId, newName);
    if (!updated) return { ok: false, code: 'not_found' };
    return { ok: true, value: updated };
  }

  async setDescription(
    roomId: string,
    callerUserId: string,
    description: string | null,
  ): Promise<RoomMutationResult> {
    const guard = await this.guardOwner(roomId, callerUserId);
    if (!guard.ok) return guard;
    const updated = await this.rooms.setDescription(roomId, description);
    if (!updated) return { ok: false, code: 'not_found' };
    return { ok: true, value: updated };
  }

  async setPassword(
    roomId: string,
    callerUserId: string,
    password: string | null,
  ): Promise<RoomMutationResult> {
    const guard = await this.guardOwner(roomId, callerUserId);
    if (!guard.ok) return guard;
    const updated = await this.rooms.setPassword(roomId, password);
    if (!updated) return { ok: false, code: 'not_found' };
    return { ok: true, value: updated };
  }

  async setVisibility(
    roomId: string,
    callerUserId: string,
    visibility: RoomVisibility,
  ): Promise<RoomMutationResult> {
    const guard = await this.guardOwner(roomId, callerUserId);
    if (!guard.ok) return guard;
    const updated = await this.rooms.setVisibility(roomId, visibility);
    if (!updated) return { ok: false, code: 'not_found' };
    return { ok: true, value: updated };
  }

  async incrementMembers(roomId: string): Promise<void> {
    if (this.isGlobal(roomId)) return;
    await this.rooms.incrementMembers(roomId);
  }

  async decrementMembers(roomId: string): Promise<void> {
    if (this.isGlobal(roomId)) return;
    await this.rooms.decrementMembers(roomId);
  }

  private async guardOwner(
    roomId: string,
    callerUserId: string,
  ): Promise<RoomResult<Room>> {
    if (this.isGlobal(roomId)) return { ok: false, code: 'global_immutable' };
    const room = await this.rooms.get(roomId);
    if (!room) return { ok: false, code: 'not_found' };
    if (room.owner !== callerUserId) return { ok: false, code: 'forbidden' };
    return { ok: true, value: room };
  }
}
