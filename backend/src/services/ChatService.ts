import type { ChatMessage, MessageSegment } from '@webchat/shared';

import type { ConnectionsRepository, UsersRepository } from '@/repositories';
import type { WebSocketBroadcaster } from '@/services';
import { UserService } from '@/services/UserService';
import { IncomingMessageSchema, type IncomingMessage } from '@/models';
import type { Logger } from '@/utils';

export class ChatService {
  constructor(
    private readonly users: UsersRepository,
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

  async broadcast(
    connectionId: string,
    content: string,
    endpoint: string,
  ): Promise<void> {
    const meta = await this.connections.lookup(connectionId);
    if (!meta) {
      this.logger.warn('sendmessage from unknown connection', { connectionId });
      return;
    }

    const profile = await this.users.get(meta.userId);
    if (!profile) return;

    const message: ChatMessage = {
      kind: 'user',
      user: UserService.toPublic(profile),
      content,
      timestamp: new Date().toISOString(),
    };

    const ids = await this.connections.listConnectionIds(meta.roomId);
    await this.broadcaster.send(ids, { type: 'message', data: message }, endpoint);
  }

  async broadcastSystem(
    connectionIds: string[],
    segments: MessageSegment[],
    endpoint: string,
  ): Promise<void> {
    const message: ChatMessage = {
      kind: 'system',
      segments,
      timestamp: new Date().toISOString(),
    };
    await this.broadcaster.send(
      connectionIds,
      { type: 'message', data: message },
      endpoint,
    );
  }
}
