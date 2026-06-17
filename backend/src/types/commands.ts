import type { CommandResult } from '@webchat/shared';

import type { ParseResult } from '@/types/parsing';

export interface CommandContext {
  callerUserId: string;
  callerConnectionId: string;
  endpoint: string;
  defer: (action: () => Promise<void>) => void;
}

export interface CommandDef<TArgs> {
  name: string;
  description: string;
  usage?: string;
  hidden?: boolean;
  parseArgs: (rest: string) => ParseResult<TArgs>;
  execute: (ctx: CommandContext, args: TArgs) => Promise<CommandResult>;
}

export interface RegisteredCommand {
  name: string;
  description: string;
  usage?: string;
  hidden: boolean;
  run: (rest: string, ctx: CommandContext) => Promise<CommandResult>;
}

export interface CommandMatch {
  command: RegisteredCommand;
  rest: string;
}
