import type { ConnectionsRepository } from '@/repositories';
import type { UserService, ChatService, WebSocketBroadcaster } from '@/services';
import { SystemMessageFactory } from '@/factories';
import type { Logger } from '@/utils';

export class PresenceService {
  constructor(
    private readonly connections: ConnectionsRepository,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly broadcaster: WebSocketBroadcaster,
    private readonly logger: Logger,
  ) {}

  async register(
    connectionId: string,
    ip: string,
    userAgent: string,
    endpoint: string,
  ): Promise<void> {
    const user = this.userService.assignFor(ip, userAgent);
    await this.connections.add(connectionId, user);

    const all = await this.connections.listAll();
    const others = all.filter((id) => id !== connectionId);
    await this.broadcaster.send(others, { type: 'users_count', count: all.length }, endpoint);
    await this.chatService.broadcastSystemToOthers(
      connectionId,
      SystemMessageFactory.joined(user),
      endpoint,
    );
  }

  async unregister(connectionId: string, endpoint: string): Promise<void> {
    await this.connections.remove(connectionId);
    const remaining = await this.connections.listAll();
    await this.broadcaster.send(remaining, { type: 'users_count', count: remaining.length }, endpoint);
  }

  async sendHelloTo(connectionId: string, endpoint: string): Promise<void> {
    const user = await this.connections.getUser(connectionId);
    if (!user) {
      this.logger.warn('hello requested for unknown connection', { connectionId });
      return;
    }
    const count = (await this.connections.listAll()).length;
    await this.broadcaster.send([connectionId], { type: 'hello', user, count }, endpoint);
  }
}
