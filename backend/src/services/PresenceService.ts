import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';

import type { ConnectionsRepository } from '@/repositories';
import type { UserService } from '@/services';
import type { Logger } from '@/utils';

export class PresenceService {
  constructor(
    private readonly connections: ConnectionsRepository,
    private readonly userService: UserService,
    private readonly apiClientFactory: (endpoint: string) => ApiGatewayManagementApiClient,
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
    await this.fanout(others, { type: 'users_count', count: all.length }, endpoint);
  }

  async unregister(connectionId: string, endpoint: string): Promise<void> {
    await this.connections.remove(connectionId);
    const remaining = await this.connections.listAll();
    await this.fanout(remaining, { type: 'users_count', count: remaining.length }, endpoint);
  }

  async sendHelloTo(connectionId: string, endpoint: string): Promise<void> {
    const user = await this.connections.getUser(connectionId);
    if (!user) {
      this.logger.warn('hello requested for unknown connection', { connectionId });
      return;
    }
    const count = (await this.connections.listAll()).length;
    await this.fanout([connectionId], { type: 'hello', user, count }, endpoint);
  }

  private async fanout(connectionIds: string[], message: object, endpoint: string): Promise<void> {
    if (connectionIds.length === 0) return;

    const api = this.apiClientFactory(endpoint);
    const payload = Buffer.from(JSON.stringify(message));

    await Promise.all(
      connectionIds.map(async (connectionId) => {
        try {
          await api.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: payload,
            }),
          );
        } catch (err) {
          if (err instanceof GoneException) {
            await this.connections.remove(connectionId);
          } else {
            this.logger.error('PostToConnection failed', { connectionId, err });
          }
        }
      }),
    );
  }
}
