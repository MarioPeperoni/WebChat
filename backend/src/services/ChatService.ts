import type { ChatMessage, MessageSegment } from '@webchat/shared';

import type { ConnectionsRepository } from '@/repositories';
import type { WebSocketBroadcaster } from '@/services';
import { IncomingMessageSchema, type IncomingMessage } from '@/models';
import type { Logger } from '@/utils';

export class ChatService {
  constructor(
    private readonly connections: ConnectionsRepository,
    private readonly broadcaster: WebSocketBroadcaster,
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

    const message: ChatMessage = {
      kind: 'user',
      user,
      content,
      timestamp: new Date().toISOString(),
    };

    const connectionIds = await this.connections.listAll();
    await this.broadcaster.send(connectionIds, { type: 'message', data: message }, endpoint);
  }

  async broadcastSystemToOthers(
    excludeConnectionId: string,
    segments: MessageSegment[],
    endpoint: string,
  ): Promise<void> {
    const message: ChatMessage = {
      kind: 'system',
      segments,
      timestamp: new Date().toISOString(),
    };

    const all = await this.connections.listAll();
    const others = all.filter((id) => id !== excludeConnectionId);
    await this.broadcaster.send(others, { type: 'message', data: message }, endpoint);
  }

}
