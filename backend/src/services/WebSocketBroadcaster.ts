import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';

import type { ConnectionsRepository } from '@/repositories';
import type { Logger } from '@/utils';

export class WebSocketBroadcaster {
  private readonly clients = new Map<string, ApiGatewayManagementApiClient>();

  constructor(
    private readonly connections: ConnectionsRepository,
    private readonly logger: Logger,
  ) {}

  async send(connectionIds: string[], payload: object, endpoint: string): Promise<void> {
    if (connectionIds.length === 0) return;

    const api = this.clientFor(endpoint);
    const data = Buffer.from(JSON.stringify(payload));

    await Promise.all(
      connectionIds.map(async (id) => {
        try {
          await api.send(new PostToConnectionCommand({ ConnectionId: id, Data: data }));
        } catch (err) {
          if (err instanceof GoneException) {
            await this.cleanupDead(id);
          } else {
            this.logger.error('PostToConnection failed', { connectionId: id, err });
          }
        }
      }),
    );
  }

  private async cleanupDead(connectionId: string): Promise<void> {
    const meta = await this.connections.lookup(connectionId);
    if (!meta) return;
    await this.connections.remove(connectionId, meta.roomId);
  }

  private clientFor(endpoint: string): ApiGatewayManagementApiClient {
    const cached = this.clients.get(endpoint);
    if (cached) return cached;
    const client = new ApiGatewayManagementApiClient({ endpoint });
    this.clients.set(endpoint, client);
    return client;
  }
}
