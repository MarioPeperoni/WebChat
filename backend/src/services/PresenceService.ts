import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

import type { User, UserPublic } from '@webchat/shared';

import type {
  UsersRepository,
  PresenceRepository,
  ConnectionsRepository,
} from '@/repositories';
import type { UserService, ChatService, WebSocketBroadcaster } from '@/services';
import { UserService as UserServiceClass } from '@/services/UserService';
import type { ConnectPresence } from '@/models';
import { SystemMessageFactory } from '@/factories';
import type { Logger } from '@/utils';

const DEFAULT_ROOM = 'global';
const JOIN_DEBOUNCE_MS = 10_000;

export class PresenceService {
  constructor(
    private readonly users: UsersRepository,
    private readonly presence: PresenceRepository,
    private readonly connections: ConnectionsRepository,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly broadcaster: WebSocketBroadcaster,
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

    await this.connections.add({ connectionId, userId, roomId: DEFAULT_ROOM });
    await this.presence.setUserPresent(DEFAULT_ROOM, UserServiceClass.toPublic(profile));

    if (this.shouldAnnounceJoin(isNew, sessions, oldLastSeenAt, now)) {
      const others = (await this.connections.listConnectionIds(DEFAULT_ROOM))
        .filter((id) => id !== connectionId);
      await this.chatService.broadcastSystem(
        others,
        SystemMessageFactory.joined(UserServiceClass.toPublic(profile)),
        endpoint,
      );
    }
  }

  async unregister(connectionId: string): Promise<void> {
    const meta = await this.connections.lookup(connectionId);
    if (!meta) return;

    await this.connections.remove(connectionId, meta.roomId);
    const sessions = await this.users.decrementSessions(meta.userId);
    if (sessions <= 0) {
      await this.presence.removeUserPresent(meta.roomId, meta.userId);
    }
  }

  async updateColor(
    userId: string,
    color: string,
    endpoint: string,
  ): Promise<UserPublic | null> {
    const now = new Date().toISOString();
    const updated = await this.users.setColor(userId, color, now);
    if (!updated) return null;

    const publicProfile = UserServiceClass.toPublic(updated);
    await this.presence.setUserPresent(DEFAULT_ROOM, publicProfile);

    const ids = await this.connections.listConnectionIds(DEFAULT_ROOM);
    await this.broadcaster.send(
      ids,
      { type: 'user_updated', user: publicProfile },
      endpoint,
    );

    return publicProfile;
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

    await this.broadcaster.send(
      [connectionId],
      {
        type: 'hello',
        user: UserServiceClass.toPublic(profile),
        count: usersInRoom.length,
      },
      endpoint,
    );
  }

  private async ensureProfile(
    userId: string,
    presence: ConnectPresence,
    now: string,
  ): Promise<{ profile: User; isNew: boolean }> {
    const existing = await this.users.get(userId);
    if (existing) return { profile: existing, isNew: false };

    const profile = this.userService.generateInitialProfile(userId, presence, now);
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
