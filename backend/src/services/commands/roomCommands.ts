import { GLOBAL_ROOM_ID, type MessageSegment, type Room, type RoomSummary, type RoomVisibility } from '@webchat/shared';

import type { ConnectionsRepository, UsersRepository } from '@/repositories';
import type { PresenceService, RoomsService, WebSocketBroadcaster } from '@/services';
import { CommandFormatter } from '@/services/commands/CommandFormatter';
import type { CommandContext, CommandDef, RoomFailureCode, RoomMutationResult } from '@/types';
import { capitalize, noArgs, optionalText, requireEnum, requireSlug, splitFirstAndRest } from '@/utils';

const PASSWORD_MAX = 64;
const DESCRIPTION_MAX = 200;

export interface RoomCommandDeps {
  rooms: RoomsService;
  users: UsersRepository;
  connections: ConnectionsRepository;
  presenceService: PresenceService;
  broadcaster: WebSocketBroadcaster;
}

export const buildRoomCommands = (deps: RoomCommandDeps): readonly CommandDef<any>[] => [
  {
    name: 'room info',
    description: 'show info about the current room',
    parseArgs: noArgs,
    execute: (ctx) => renderCurrentInfo(ctx, deps),
  } satisfies CommandDef<null>,

  {
    name: 'room',
    description: 'alias for /room info',
    hidden: true,
    parseArgs: noArgs,
    execute: (ctx) => renderCurrentInfo(ctx, deps),
  } satisfies CommandDef<null>,

  {
    name: 'room list',
    description: 'list public rooms',
    parseArgs: noArgs,
    execute: async () => {
      const rooms = await deps.rooms.listPublic();
      return CommandFormatter.ok(await renderRoomList(rooms, deps));
    },
  } satisfies CommandDef<null>,

  {
    name: 'room create',
    description: 'create a new public room (you become its owner)',
    usage: '/room create <name>',
    parseArgs: (rest) => requireSlug(rest, 'room name'),
    execute: async (ctx, name) => {
      const now = new Date().toISOString();
      const result = await deps.rooms.create(name, ctx.callerUserId, now);
      if (!result.ok) return mapFailure(result.code);
      return CommandFormatter.ok([
        CommandFormatter.line(`room "${name}" created.`, undefined, true),
        CommandFormatter.line(`join with: /room join ${name}`),
      ]);
    },
  } satisfies CommandDef<string>,

  {
    name: 'room join',
    description: 'switch to another room',
    usage: '/room join <name> [password]',
    parseArgs: (rest) => splitFirstAndRest(rest, 'room name'),
    execute: async (ctx, { first, rest }) => {
      const check = await deps.rooms.checkPasswordOk(first, rest.length ? rest : null);
      if (!check.ok) return mapFailure(check.code);
      const room = await deps.presenceService.switchRoom(
        ctx.callerConnectionId,
        check.value.roomId,
        ctx.endpoint,
      );
      if (!room) return CommandFormatter.error('room switch failed');
      ctx.defer(() => notifyCallerRoomChanged(ctx, deps, room));
      return CommandFormatter.ok([CommandFormatter.line('Switching rooms...')]);
    },
  } satisfies CommandDef<{ first: string; rest: string }>,

  {
    name: 'room leave',
    description: 'return to the global room',
    parseArgs: noArgs,
    execute: async (ctx) => {
      const room = await deps.presenceService.switchRoom(
        ctx.callerConnectionId,
        'global',
        ctx.endpoint,
      );
      if (!room) return CommandFormatter.error('leave failed');
      ctx.defer(() => notifyCallerRoomChanged(ctx, deps, room));
      return CommandFormatter.ok([CommandFormatter.line('Switching rooms...')]);
    },
  } satisfies CommandDef<null>,

  {
    name: 'room set name',
    description: 'rename the current room (owner only)',
    usage: '/room set name <name>',
    parseArgs: (rest) => requireSlug(rest, 'room name'),
    execute: (ctx, name) =>
      applyOwnerMutation(ctx, deps, async (roomId) => ({
        result: await deps.rooms.setName(roomId, ctx.callerUserId, name),
        success: [CommandFormatter.line(`Name updated to "${name}".`, undefined, true)],
      })),
  } satisfies CommandDef<string>,

  {
    name: 'room set description',
    description: `set room description (owner only, max ${DESCRIPTION_MAX} chars)`,
    usage: '/room set description <text>',
    parseArgs: (rest) => optionalText(rest, 'description', DESCRIPTION_MAX),
    execute: (ctx, description) =>
      applyOwnerMutation(ctx, deps, async (roomId) => ({
        result: await deps.rooms.setDescription(roomId, ctx.callerUserId, description),
        success: [
          CommandFormatter.line(
            description ? 'Description updated.' : 'Description cleared.',
            undefined,
            true,
          ),
          CommandFormatter.keyValue('description', description ?? '(none)'),
        ],
      })),
  } satisfies CommandDef<string | null>,

  {
    name: 'room set password',
    description: 'set or clear room password (owner only, empty = clear)',
    usage: '/room set password [password]',
    parseArgs: (rest) => optionalText(rest, 'password', PASSWORD_MAX),
    execute: (ctx, password) =>
      applyOwnerMutation(ctx, deps, async (roomId) => ({
        result: await deps.rooms.setPassword(roomId, ctx.callerUserId, password),
        success: [
          CommandFormatter.line(password ? 'Password set.' : 'Password removed.', undefined, true),
        ],
      })),
  } satisfies CommandDef<string | null>,

  {
    name: 'room set visibility',
    description: 'public or private (private hidden from /room list)',
    usage: '/room set visibility <public|private>',
    parseArgs: (rest) => requireEnum<RoomVisibility>(rest, 'visibility', ['public', 'private']),
    execute: (ctx, visibility) =>
      applyOwnerMutation(ctx, deps, async (roomId) => ({
        result: await deps.rooms.setVisibility(roomId, ctx.callerUserId, visibility),
        success: [CommandFormatter.line(`Visibility set to ${visibility}.`, undefined, true)],
      })),
  } satisfies CommandDef<RoomVisibility>,
];

async function renderCurrentInfo(ctx: CommandContext, deps: RoomCommandDeps) {
  const meta = await deps.connections.lookup(ctx.callerConnectionId);
  if (!meta) return CommandFormatter.error('not connected');
  const room = await deps.rooms.get(meta.roomId);
  if (!room) return CommandFormatter.error('room missing');
  const liveRoom = await withLiveCount(room, deps);
  return CommandFormatter.ok([
    CommandFormatter.header(`${capitalize(room.name)} room info`),
    ...(await renderRoomDetails(liveRoom, deps)),
  ]);
}

async function withLiveCount(room: Room, deps: RoomCommandDeps): Promise<Room> {
  const live = (await deps.connections.listConnectionIds(room.roomId)).length;
  return { ...room, memberCount: live };
}

async function renderRoomDetails(room: Room, deps: RoomCommandDeps): Promise<MessageSegment[][]> {
  if (room.roomId === GLOBAL_ROOM_ID) {
    return [
      CommandFormatter.keyValue('name', room.name),
      CommandFormatter.keyValue('description', room.description ?? '(none)'),
      CommandFormatter.keyValue('visibility', room.visibility),
    ];
  }
  const owner = room.owner ? await deps.users.get(room.owner) : null;
  return [
    CommandFormatter.keyValue('name', room.name),
    CommandFormatter.keyValue('description', room.description ?? '(none)'),
    CommandFormatter.keyValue('visibility', room.visibility),
    CommandFormatter.keyValue('locked', room.password ? 'yes' : 'no'),
    owner
      ? CommandFormatter.keyValueSegment('owner', {
          text: owner.name,
          color: owner.color,
          bold: true,
        })
      : CommandFormatter.keyValue('owner', '(none)'),
    CommandFormatter.keyValue('members', String(room.memberCount)),
    CommandFormatter.keyValue('created', room.createdAt),
  ];
}

async function renderRoomList(
  rooms: RoomSummary[],
  deps: RoomCommandDeps,
): Promise<MessageSegment[][]> {
  if (rooms.length === 0) {
    return [
      CommandFormatter.header('Public rooms'),
      CommandFormatter.line('(no public rooms yet — try /room create <name>)'),
    ];
  }
  const liveCounts = await Promise.all(
    rooms.map((r) => deps.connections.listConnectionIds(r.roomId)),
  );
  return [
    CommandFormatter.header('Public rooms'),
    ...rooms.map((room, i) =>
      CommandFormatter.keyValue(room.name, `${liveCounts[i]!.length} member(s)`),
    ),
  ];
}

function mapFailure(code: RoomFailureCode) {
  const map: Record<RoomFailureCode, string> = {
    not_found: 'room not found',
    already_exists: 'room already exists',
    forbidden: 'only the room owner can do that',
    global_immutable: 'global room cannot be modified',
    missing_password: 'this room is locked — use: /room join <name> <password>',
    invalid_password: 'invalid password',
  };
  return CommandFormatter.error(map[code]);
}

async function applyOwnerMutation(
  ctx: CommandContext,
  deps: RoomCommandDeps,
  op: (roomId: string) => Promise<{
    result: RoomMutationResult;
    success: MessageSegment[][];
  }>,
) {
  const meta = await deps.connections.lookup(ctx.callerConnectionId);
  if (!meta) return CommandFormatter.error('not connected');
  const { result, success } = await op(meta.roomId);
  if (!result.ok) return mapFailure(result.code);
  const liveRoom = await withLiveCount(result.value, deps);
  const ids = await deps.connections.listConnectionIds(meta.roomId);
  await deps.broadcaster.send(ids, { type: 'room_changed', room: liveRoom }, ctx.endpoint);
  return CommandFormatter.ok(success);
}

async function notifyCallerRoomChanged(
  ctx: CommandContext,
  deps: RoomCommandDeps,
  room: Room,
): Promise<void> {
  const liveRoom = await withLiveCount(room, deps);
  await deps.broadcaster.send(
    [ctx.callerConnectionId],
    { type: 'room_changed', room: liveRoom },
    ctx.endpoint,
  );
}
