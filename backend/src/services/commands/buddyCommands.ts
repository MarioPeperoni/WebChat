import type { MessageSegment, User } from '@webchat/shared';

import type {
  ConnectionsRepository,
  PresenceRepository,
  UsersRepository,
} from '@/repositories';
import type { BuddiesService, PresenceService } from '@/services';
import { CommandFormatter } from '@/services/commands/CommandFormatter';
import type { CommandContext, CommandDef } from '@/types';
import { noArgs, requireRest } from '@/utils';

export interface BuddyCommandDeps {
  buddies: BuddiesService;
  users: UsersRepository;
  presence: PresenceRepository;
  connections: ConnectionsRepository;
  presenceService: PresenceService;
}

export const buildBuddyCommands = (deps: BuddyCommandDeps): readonly CommandDef<any>[] => [
  {
    name: 'buddy add',
    description: 'add a user to your buddies',
    usage: '/buddy add <user>',
    parseArgs: (rest) => requireRest(rest, 'user'),
    execute: async (ctx, target) => {
      const profile = await resolveUserProfile(ctx, target, deps);
      if (!profile) return CommandFormatter.error(`user not found: ${target}`);
      const result = await deps.buddies.addBuddy(ctx.callerUserId, profile.userId);
      if (!result.ok) {
        return CommandFormatter.error(
          result.code === 'self' ? 'cannot add yourself' : `user not found: ${target}`,
        );
      }
      ctx.defer(() =>
        deps.presenceService.broadcastBuddyAddedToOwner(
          ctx.callerUserId,
          result.buddy,
          ctx.endpoint,
        ),
      );
      return CommandFormatter.ok([
        [
          { text: 'added ', bold: true },
          { text: result.buddy.name, color: result.buddy.color, bold: true },
          { text: ' to buddies.' },
        ],
      ]);
    },
  } satisfies CommandDef<string>,

  {
    name: 'buddy remove',
    description: 'remove a user from your buddies',
    usage: '/buddy remove <user>',
    parseArgs: (rest) => requireRest(rest, 'user'),
    execute: async (ctx, target) => {
      const profile = await resolveUserProfile(ctx, target, deps);
      if (!profile) return CommandFormatter.error(`user not found: ${target}`);
      const result = await deps.buddies.removeBuddy(ctx.callerUserId, profile.userId);
      if (!result.ok) return CommandFormatter.error('cannot remove yourself');
      ctx.defer(() =>
        deps.presenceService.broadcastBuddyRemovedToOwner(
          ctx.callerUserId,
          profile.userId,
          ctx.endpoint,
        ),
      );
      return CommandFormatter.ok([
        [
          { text: 'removed ', bold: true },
          { text: profile.name, color: profile.color, bold: true },
          { text: ' from buddies.' },
        ],
      ]);
    },
  } satisfies CommandDef<string>,

  {
    name: 'buddy list',
    description: 'show your buddies',
    parseArgs: noArgs,
    execute: async (ctx) => {
      const buddies = await deps.buddies.listBuddies(ctx.callerUserId);
      if (buddies.length === 0) {
        return CommandFormatter.ok([
          CommandFormatter.line('(no buddies yet — use /buddy add <user>)'),
        ]);
      }
      const lines: MessageSegment[][] = [CommandFormatter.header('Buddies')];
      for (const buddy of buddies) {
        lines.push([
          { text: buddy.online ? '● ' : '○ ', color: buddy.online ? '#008000' : '#808080' },
          { text: buddy.name, color: buddy.color, bold: true },
          { text: buddy.online ? '  online' : '  offline' },
        ]);
      }
      return CommandFormatter.ok(lines);
    },
  } satisfies CommandDef<null>,
];

async function resolveUserProfile(
  ctx: CommandContext,
  target: string,
  deps: BuddyCommandDeps,
): Promise<User | null> {
  const direct = await deps.users.get(target);
  if (direct) return direct;

  const meta = await deps.connections.lookup(ctx.callerConnectionId);
  if (!meta) return null;
  const present = await deps.presence.listUsers(meta.roomId);
  const byNick = present.find((u) => u.name.toLowerCase() === target.toLowerCase());
  if (!byNick) return null;
  return deps.users.get(byNick.userId);
}
