import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';

import type { ConnectionsRepository } from '@/repositories';
import { IncomingMessageSchema, type IncomingMessage, type OutgoingMessage } from '@/models';
import type { Logger } from '@/utils';

export class ChatService {
  constructor(
    private readonly connections: ConnectionsRepository,
    private readonly apiClientFactory: (endpoint: string) => ApiGatewayManagementApiClient,
    private readonly logger: Logger,
  ) {}

  parse(raw: string | undefined): IncomingMessage | null {
    if (!raw) return null;
    try {
      const result = IncomingMessageSchema.safeParse(JSON.parse(raw));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  async broadcast(connectionId: string, content: string, endpoint: string): Promise<void> {
    const user = await this.connections.getUser(connectionId);
    if (!user) {
      this.logger.warn('sendmessage from unknown connection', { connectionId });
      return;
    }

    const outgoing: OutgoingMessage = {
      user,
      content,
      timestamp: new Date().toISOString(),
    };

    const api = this.apiClientFactory(endpoint);
    const payload = Buffer.from(JSON.stringify({ type: 'message', data: outgoing }));

    const connectionIds = await this.connections.listAll();

    await Promise.all(
      connectionIds.map(async (id) => {
        try {
          await api.send(
            new PostToConnectionCommand({
              ConnectionId: id,
              Data: payload,
            }),
          );
        } catch (err) {
          if (err instanceof GoneException) {
            await this.connections.remove(id);
          } else {
            this.logger.error('PostToConnection failed', { connectionId: id, err });
          }
        }
      }),
    );
  }
}
