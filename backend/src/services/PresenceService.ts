import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import {
  GLOBAL_ROOM_ID,
  type Buddy,
  type Room,
  type RoomSummary,
  type User,
  type UserPublic,
} from '@webchat/shared';

import type {
  UsersRepository,
  PresenceRepository,
  ConnectionsRepository,
} from '@/repositories';
import type {
  BuddiesService,
  UserService,
  ChatService,
  WebSocketBroadcaster,
  GeoService,
  RoomsService,
} from '@/services';
import { UserService as UserServiceClass } from '@/services/UserService';
import type { ConnectPresence } from '@/models';
import { SystemMessageFactory } from '@/factories';
import type { Logger } from '@/utils';

const JOIN_DEBOUNCE_MS = 10_000;

export class PresenceService {
  constructor(
    private readonly users: UsersRepository,
    private readonly presence: PresenceRepository,
    private readonly connections: ConnectionsRepository,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly broadcaster: WebSocketBroadcaster,
    private readonly geoService: GeoService,
    private readonly rooms: RoomsService,
    private readonly buddies: BuddiesService,
    private readonly logger: Logger,
  ) {}

  async register(
    connectionId: string,
    userId: string,
    presence: ConnectPresence,
    endpoint: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    const { profile, isNew } = await this.ensureProfile(userId, presence, now);
    const oldLastSeenAt = profile.metadata.lastSeenAt;

    await this.users.updatePresence(userId, presence, now);
    const sessions = await this.users.incrementSessions(userId);

    await this.connections.add({ connectionId, userId, roomId: GLOBAL_ROOM_ID });
    const publicProfile = UserServiceClass.toPublic(profile);
    await this.presence.setUserPresent(GLOBAL_ROOM_ID, publicProfile);

    const others = (await this.connections.listConnectionIds(GLOBAL_ROOM_ID))
      .filter((id) => id !== connectionId);

    await this.broadcaster.send(
      others,
      { type: 'room_user_joined', user: publicProfile },
      endpoint,
    );

    if (this.shouldAnnounceJoin(isNew, sessions, oldLastSeenAt, now)) {
      await this.chatService.broadcastSystem(
        others,
        SystemMessageFactory.joined(publicProfile),
        endpoint,
      );
    }

    if (sessions === 1) {
      await this.notifyBuddyOwners(userId, true, endpoint);
    }

    await this.broadcastRoomsList(endpoint, connectionId);
  }

  async unregister(connectionId: string, endpoint: string): Promise<void> {
    const meta = await this.connections.lookup(connectionId);
    if (!meta) return;

    await this.connections.remove(connectionId, meta.roomId);
    await this.rooms.decrementMembers(meta.roomId);
    const sessions = await this.users.decrementSessions(meta.userId);
    if (sessions > 0) return;

    await this.presence.removeUserPresent(meta.roomId, meta.userId);

    const profile = await this.users.get(meta.userId);
    if (!profile) return;

    const remaining = await this.connections.listConnectionIds(meta.roomId);
    await this.broadcaster.send(
      remaining,
      { type: 'room_user_left', userId: meta.userId },
      endpoint,
    );
    await this.chatService.broadcastSystem(
      remaining,
      SystemMessageFactory.left(UserServiceClass.toPublic(profile)),
      endpoint,
    );

    await this.notifyBuddyOwners(meta.userId, false, endpoint);
    await this.broadcastRoomsList(endpoint);
  }

  async switchRoom(
    connectionId: string,
    newRoomId: string,
    endpoint: string,
  ): Promise<Room | null> {
    const meta = await this.connections.lookup(connectionId);
    if (!meta) return null;
    if (meta.roomId === newRoomId) return this.rooms.get(newRoomId);

    const profile = await this.users.get(meta.userId);
    if (!profile) return null;

    const publicProfile = UserServiceClass.toPublic(profile);

    await this.presence.removeUserPresent(meta.roomId, meta.userId);
    await this.connections.moveToRoom(meta, newRoomId);
    await this.presence.setUserPresent(newRoomId, publicProfile);

    await this.rooms.decrementMembers(meta.roomId);
    await this.rooms.incrementMembers(newRoomId);

    const oldRoomMembers = await this.connections.listConnectionIds(meta.roomId);
    const newRoomMembers = (await this.connections.listConnectionIds(newRoomId))
      .filter((id) => id !== connectionId);

    await this.broadcaster.send(
      oldRoomMembers,
      { type: 'room_user_left', userId: meta.userId },
      endpoint,
    );
    await this.broadcaster.send(
      newRoomMembers,
      { type: 'room_user_joined', user: publicProfile },
      endpoint,
    );
    await this.chatService.broadcastSystem(
      oldRoomMembers,
      SystemMessageFactory.left(publicProfile),
      endpoint,
    );
    await this.chatService.broadcastSystem(
      newRoomMembers,
      SystemMessageFactory.joined(publicProfile),
      endpoint,
    );

    await this.broadcastRoomsList(endpoint);

    return this.rooms.get(newRoomId);
  }

  async broadcastUserUpdate(
    user: UserPublic,
    endpoint: string,
  ): Promise<void> {
    await this.presence.setUserPresent(GLOBAL_ROOM_ID, user);
    const connections = await this.connections.listConnectionIdsForUser(user.userId);
    const roomIds = new Set<string>();
    for (const connectionId of connections) {
      const meta = await this.connections.lookup(connectionId);
      if (meta) roomIds.add(meta.roomId);
    }
    const ids = new Set<string>();
    for (const roomId of roomIds) {
      const roomConnections = await this.connections.listConnectionIds(roomId);
      for (const id of roomConnections) ids.add(id);
    }
    await this.broadcaster.send(
      Array.from(ids),
      { type: 'user_updated', user },
      endpoint,
    );
  }

  async sendHelloTo(connectionId: string, endpoint: string): Promise<void> {
    const meta = await this.connections.lookup(connectionId);
    if (!meta) {
      this.logger.warn('hello for unknown connection', { connectionId });
      return;
    }

    const profile = await this.users.get(meta.userId);
    if (!profile) {
      this.logger.warn('hello: profile missing', { connectionId, userId: meta.userId });
      return;
    }

    const usersInRoom = await this.presence.listUsers(meta.roomId);
    const room = await this.rooms.get(meta.roomId);
    const rooms = await this.snapshotRoomsList();
    const buddies = await this.buddies.listBuddies(meta.userId);

    await this.broadcaster.send(
      [connectionId],
      {
        type: 'hello',
        user: UserServiceClass.toPublic(profile),
        room,
        users: usersInRoom,
        rooms,
        buddies,
      },
      endpoint,
    );
  }

  async notifyBuddyOwners(
    userId: string,
    online: boolean,
    endpoint: string,
  ): Promise<void> {
    const ownerIds = await this.buddies.listOwnersOf(userId);
    if (ownerIds.length === 0) return;
    const targetConnections = (
      await Promise.all(
        ownerIds.map((ownerId) => this.connections.listConnectionIdsForUser(ownerId)),
      )
    ).flat();
    if (targetConnections.length === 0) return;
    await this.broadcaster.send(
      targetConnections,
      { type: 'buddy_presence_changed', userId, online },
      endpoint,
    );
  }

  async broadcastBuddyAddedToOwner(
    ownerId: string,
    buddy: Buddy,
    endpoint: string,
  ): Promise<void> {
    const connections = await this.connections.listConnectionIdsForUser(ownerId);
    if (connections.length === 0) return;
    await this.broadcaster.send(
      connections,
      { type: 'buddy_added', buddy },
      endpoint,
    );
  }

  async broadcastBuddyRemovedToOwner(
    ownerId: string,
    buddyUserId: string,
    endpoint: string,
  ): Promise<void> {
    const connections = await this.connections.listConnectionIdsForUser(ownerId);
    if (connections.length === 0) return;
    await this.broadcaster.send(
      connections,
      { type: 'buddy_removed', userId: buddyUserId },
      endpoint,
    );
  }

  async snapshotRoomsList(): Promise<RoomSummary[]> {
    const publicRooms = await this.rooms.listPublic();
    const counts = await Promise.all(
      publicRooms.map((r) => this.connections.listConnectionIds(r.roomId)),
    );
    const enriched = publicRooms
      .filter((r) => r.roomId !== GLOBAL_ROOM_ID)
      .map((room, i) => ({ ...room, memberCount: counts[i]!.length }));

    const globalCount = (await this.connections.listConnectionIds(GLOBAL_ROOM_ID)).length;
    const global: RoomSummary = {
      roomId: GLOBAL_ROOM_ID,
      name: GLOBAL_ROOM_ID,
      memberCount: globalCount,
      hasPassword: false,
    };
    return [global, ...enriched];
  }

  async broadcastRoomsList(endpoint: string, excludeConnectionId?: string): Promise<void> {
    const rooms = await this.snapshotRoomsList();
    const all = await this.connections.listAllConnectionIds();
    const targets = excludeConnectionId
      ? all.filter((id) => id !== excludeConnectionId)
      : all;
    await this.broadcaster.send(targets, { type: 'rooms_list', rooms }, endpoint);
  }

  private async ensureProfile(
    userId: string,
    presence: ConnectPresence,
    now: string,
  ): Promise<{ profile: User; isNew: boolean }> {
    const existing = await this.users.get(userId);
    if (existing) return { profile: existing, isNew: false };

    const enriched = await this.enrichWithCountry(presence);
    const profile = this.userService.generateInitialProfile(userId, enriched, now);
    try {
      await this.users.create(profile);
      return { profile, isNew: true };
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        const refetched = await this.users.get(userId);
        if (refetched) return { profile: refetched, isNew: false };
      }
      throw err;
    }
  }

  private async enrichWithCountry(
    presence: ConnectPresence,
  ): Promise<ConnectPresence> {
    if (presence.country || !presence.ip) return presence;
    const country = await this.geoService.lookupCountry(presence.ip);
    return { ...presence, country };
  }

  private shouldAnnounceJoin(
    isNew: boolean,
    sessions: number,
    oldLastSeenAt: string,
    now: string,
  ): boolean {
    if (isNew) return true;
    if (sessions !== 1) return false;
    const elapsedMs = Date.parse(now) - Date.parse(oldLastSeenAt);
    return elapsedMs >= JOIN_DEBOUNCE_MS;
  }
}
