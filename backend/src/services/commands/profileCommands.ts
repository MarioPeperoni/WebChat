import type { MessageSegment, User } from '@webchat/shared';

import type { ConnectionsRepository, PresenceRepository, UsersRepository } from '@/repositories';
import type { PresenceService } from '@/services';
import { UserService } from '@/services/UserService';
import { CommandFormatter } from '@/services/commands/CommandFormatter';
import type { CommandContext, CommandDef } from '@/types';
import { noArgs, requireHex, requireText, requireToken } from '@/utils';

const DESCRIPTION_MAX = 140;

export interface ProfileCommandDeps {
  users: UsersRepository;
  presence: PresenceRepository;
  connections: ConnectionsRepository;
  presenceService: PresenceService;
}

export const buildProfileCommands = (deps: ProfileCommandDeps): readonly CommandDef<any>[] => [
  {
    name: 'profile view',
    description: 'show a user profile (defaults to you)',
    usage: '/profile view [user]',
    parseArgs: (rest) =>
      rest.length === 0 ? { ok: true, args: null } : requireToken(rest, 'username'),
    execute: async (ctx, target) => viewProfile(ctx, target, deps),
  } satisfies CommandDef<string | null>,

  {
    name: 'profile',
    description: 'alias for /profile view',
    hidden: true,
    parseArgs: noArgs,
    execute: (ctx) => viewProfile(ctx, null, deps),
  } satisfies CommandDef<null>,

  {
    name: 'profile set color',
    description: 'change your color (#RRGGBB)',
    usage: '/profile set color #2563eb',
    parseArgs: (rest) => requireHex(rest, 'color'),
    execute: async (ctx, color) => {
      const now = new Date().toISOString();
      const updated = await deps.users.setColor(ctx.callerUserId, color, now);
      if (!updated) return CommandFormatter.error('your profile is missing');
      await deps.presenceService.broadcastUserUpdate(UserService.toPublic(updated), ctx.endpoint);
      return CommandFormatter.ok([
        CommandFormatter.line('Color updated.', undefined, true),
        CommandFormatter.keyValue('color', updated.color, updated.color),
      ]);
    },
  } satisfies CommandDef<string>,

  {
    name: 'profile set description',
    description: `change your description (max ${DESCRIPTION_MAX} chars, empty to clear)`,
    usage: '/profile set description <text>',
    parseArgs: (rest) =>
      rest.length === 0
        ? { ok: true, args: null }
        : requireText(rest, 'description', DESCRIPTION_MAX),
    execute: async (ctx, description) => {
      const now = new Date().toISOString();
      const updated = await deps.users.setDescription(ctx.callerUserId, description, now);
      if (!updated) return CommandFormatter.error('your profile is missing');
      await deps.presenceService.broadcastUserUpdate(UserService.toPublic(updated), ctx.endpoint);
      return CommandFormatter.ok([
        CommandFormatter.line(
          description ? 'Description updated.' : 'Description cleared.',
          undefined,
          true,
        ),
        CommandFormatter.keyValue('description', description ?? '(none)'),
      ]);
    },
  } satisfies CommandDef<string | null>,
];

async function viewProfile(ctx: CommandContext, target: string | null, deps: ProfileCommandDeps) {
  if (target === null || target.toLowerCase() === 'me') {
    const user = await deps.users.get(ctx.callerUserId);
    if (!user) return CommandFormatter.error('your profile is missing');
    return CommandFormatter.ok(renderProfile(user, true));
  }
  const found = await resolveUser(ctx, target, deps);
  if (!found) return CommandFormatter.error(`user not found: ${target}`);
  return CommandFormatter.ok(renderProfile(found, false));
}

function renderProfile(user: User, _isSelf: boolean): MessageSegment[][] {
  return [
    [
      { text: user.name, color: user.color, bold: true },
      { text: `'s profile`, bold: true },
    ],
    CommandFormatter.keyValue('name', user.name),
    CommandFormatter.keyValue('color', user.color, user.color),
    CommandFormatter.keyValue('description', user.description ?? '(none)'),
    CommandFormatter.keyValue('messages', String(user.messagesSent)),
    CommandFormatter.keyValue('country', user.metadata.country ?? '(unknown)'),
    CommandFormatter.keyValue('first seen', user.metadata.firstSeenAt),
  ];
}

async function resolveUser(
  ctx: CommandContext,
  target: string,
  deps: ProfileCommandDeps,
): Promise<User | null> {
  const meta = await deps.connections.lookup(ctx.callerConnectionId);
  if (meta) {
    const present = await deps.presence.listUsers(meta.roomId);
    const byNick = present.find((u) => u.name.toLowerCase() === target.toLowerCase());
    if (byNick) {
      const full = await deps.users.get(byNick.userId);
      if (full) return full;
    }
  }
  return deps.users.get(target);
}
