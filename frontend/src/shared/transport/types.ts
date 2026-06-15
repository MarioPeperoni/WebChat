import { z } from 'zod';
import type { ChatMessage, UserPublic } from '@webchat/shared';

const userPublicShape = z.custom<UserPublic>(
  (v) => typeof v === 'object' && v !== null && 'userId' in v,
);

const chatMessageShape = z.custom<ChatMessage>(
  (v) => typeof v === 'object' && v !== null && 'kind' in v,
);

export const ServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    user: userPublicShape,
    count: z.number(),
  }),
  z.object({
    type: z.literal('user_updated'),
    user: userPublicShape,
  }),
  z.object({
    type: z.literal('message'),
    data: chatMessageShape,
  }),
  z.object({
    type: z.literal('users_count'),
    count: z.number(),
  }),
]);

export type ServerEvent = z.infer<typeof ServerEventSchema>;
export type ServerEventType = ServerEvent['type'];
export type ServerEventOf<T extends ServerEventType> = Extract<ServerEvent, { type: T }>;

export type ClientAction =
  | { action: 'hello' }
  | { action: 'sendmessage'; content: string };

export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export type Unsubscribe = () => void;
