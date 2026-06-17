import type { CommandResult } from '@webchat/shared';

import { IncomingCommandSchema } from '@/models';
import type { WebSocketBroadcaster } from '@/services';
import { CommandFormatter } from '@/services/commands/CommandFormatter';
import type { CommandRegistry } from '@/services/commands/CommandRegistry';
import type { CommandContext, RegisteredCommand } from '@/types';
import type { Logger } from '@/utils';

export class CommandService {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly broadcaster: WebSocketBroadcaster,
    private readonly logger: Logger,
  ) {}

  async dispatch(
    callerConnectionId: string,
    callerUserId: string,
    rawBody: string | undefined,
    endpoint: string,
  ): Promise<void> {
    const parsed = this.parseBody(rawBody);
    if (!parsed) {
      this.logger.warn('command: invalid payload', { callerConnectionId });
      return;
    }

    const { commandId, prompt } = parsed;
    const match = this.registry.match(prompt);
    const deferred: Array<() => Promise<void>> = [];
    const ctx: CommandContext = {
      callerConnectionId,
      callerUserId,
      endpoint,
      defer: (action) => {
        deferred.push(action);
      },
    };
    const result = match
      ? await this.runMatch(match.command, match.rest, ctx)
      : CommandFormatter.error(`unknown command: ${prompt}`);

    await this.broadcaster.send(
      [callerConnectionId],
      { type: 'command_result', commandId, result },
      endpoint,
    );

    for (const action of deferred) {
      await action();
    }
  }

  private parseBody(raw: string | undefined): { commandId: string; prompt: string } | null {
    if (!raw) return null;
    try {
      const json = JSON.parse(raw);
      const result = IncomingCommandSchema.safeParse(json);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  private async runMatch(
    command: RegisteredCommand,
    rest: string,
    ctx: CommandContext,
  ): Promise<CommandResult> {
    try {
      return await command.run(rest, ctx);
    } catch (err) {
      this.logger.error('command failed', { name: command.name, err });
      return CommandFormatter.error('command failed unexpectedly');
    }
  }
}
