import { z } from 'zod';
import type {
  Buddy,
  ChatMessage,
  CommandResult,
  Room,
  RoomSummary,
  UserPublic,
} from '@webchat/shared';

const userPublicShape = z.custom<UserPublic>(
  (v) => typeof v === 'object' && v !== null && 'userId' in v,
);

const buddyShape = z.custom<Buddy>(
  (v) => typeof v === 'object' && v !== null && 'userId' in v && 'online' in v,
);

const chatMessageShape = z.custom<ChatMessage>(
  (v) => typeof v === 'object' && v !== null && 'kind' in v,
);

const roomShape = z.custom<Room>(
  (v) => typeof v === 'object' && v !== null && 'roomId' in v,
);

const roomSummaryShape = z.custom<RoomSummary>(
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
    users: z.array(userPublicShape),
    rooms: z.array(roomSummaryShape),
    buddies: z.array(buddyShape),
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
    type: z.literal('room_user_joined'),
    user: userPublicShape,
  }),
  z.object({
    type: z.literal('room_user_left'),
    userId: z.string(),
  }),
  z.object({
    type: z.literal('command_result'),
    commandId: z.string(),
    result: commandResultShape,
  }),
  z.object({
    type: z.literal('room_changed'),
    room: roomShape,
    users: z.array(userPublicShape),
  }),
  z.object({
    type: z.literal('rooms_list'),
    rooms: z.array(roomSummaryShape),
  }),
  z.object({
    type: z.literal('buddy_added'),
    buddy: buddyShape,
  }),
  z.object({
    type: z.literal('buddy_removed'),
    userId: z.string(),
  }),
  z.object({
    type: z.literal('buddy_presence_changed'),
    userId: z.string(),
    online: z.boolean(),
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
