import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from '@aws-sdk/client-apigatewaymanagementapi';

import type { ConnectionsRepository } from '@/repositories';
import { IncomingMessageSchema, type IncomingMessage, type OutgoingMessage } from '@/models';
import type { Logger } from '@/utils/logging';

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

  async broadcast(message: IncomingMessage, endpoint: string): Promise<void> {
    const outgoing: OutgoingMessage = {
      user: { name: message.user.name, color: message.user.color ?? '#000000' },
      content: message.content,
      timestamp: new Date().toISOString(),
    };

    const api = this.apiClientFactory(endpoint);
    const payload = Buffer.from(JSON.stringify({ type: 'message', data: outgoing }));

    const connectionIds = await this.connections.listAll();

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
