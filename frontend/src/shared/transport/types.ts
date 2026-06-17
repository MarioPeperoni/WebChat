import { z } from 'zod';
import type {
  ChatMessage,
  CommandResult,
  Room,
  UserPublic,
} from '@webchat/shared';

const userPublicShape = z.custom<UserPublic>(
  (v) => typeof v === 'object' && v !== null && 'userId' in v,
);

const chatMessageShape = z.custom<ChatMessage>(
  (v) => typeof v === 'object' && v !== null && 'kind' in v,
);

const roomShape = z.custom<Room>(
  (v) => typeof v === 'object' && v !== null && 'roomId' in v,
);

const commandResultShape = z.custom<CommandResult>(
  (v) => typeof v === 'object' && v !== null && 'status' in v && 'lines' in v,
);

export const ServerEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    user: userPublicShape,
    room: roomShape.nullable(),
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
  z.object({
    type: z.literal('command_result'),
    commandId: z.string(),
    result: commandResultShape,
  }),
  z.object({
    type: z.literal('room_changed'),
    room: roomShape,
  }),
]);

export type ServerEvent = z.infer<typeof ServerEventSchema>;
export type ServerEventType = ServerEvent['type'];
export type ServerEventOf<T extends ServerEventType> = Extract<ServerEvent, { type: T }>;

export type ClientAction =
  | { action: 'hello' }
  | { action: 'sendmessage'; content: string }
  | { action: 'command'; commandId: string; prompt: string };

export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export type Unsubscribe = () => void;
