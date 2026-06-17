import { CommandFormatter } from '@/services/commands/CommandFormatter';
import type { CommandDef, CommandMatch, RegisteredCommand } from '@/types';

export class CommandRegistry {
  private readonly commands: RegisteredCommand[] = [];

  register<TArgs>(def: CommandDef<TArgs>): void {
    this.commands.push({
      name: def.name,
      description: def.description,
      usage: def.usage,
      hidden: def.hidden === true,
      run: async (rest, ctx) => {
        const parsed = def.parseArgs(rest);
        if (!parsed.ok) return CommandFormatter.error(parsed.error);
        return def.execute(ctx, parsed.args);
      },
    });
    this.commands.sort((a, b) => b.name.split(' ').length - a.name.split(' ').length);
  }

  registerAll(defs: readonly CommandDef<unknown>[]): void {
    for (const def of defs) this.register(def);
  }

  match(input: string): CommandMatch | null {
    const stripped = input.trim().replace(/^\//, '');
    for (const command of this.commands) {
      if (stripped === command.name) return { command, rest: '' };
      if (stripped.startsWith(`${command.name} `)) {
        return {
          command,
          rest: stripped.slice(command.name.length + 1).trim(),
        };
      }
    }
    return null;
  }

  list(): readonly RegisteredCommand[] {
    return this.commands.filter((c) => !c.hidden).sort((a, b) => a.name.localeCompare(b.name));
  }

  findByName(name: string): RegisteredCommand | null {
    return this.commands.find((c) => c.name === name) ?? null;
  }
}
