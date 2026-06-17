import { CommandFormatter } from '@/services/commands/CommandFormatter';
import type { CommandRegistry } from '@/services/commands/CommandRegistry';
import type { CommandDef } from '@/types';
import { noArgs, requireText } from '@/utils';

export interface HelpCommandDeps {
  registry: CommandRegistry;
}

export const buildHelpCommands = (deps: HelpCommandDeps): readonly CommandDef<any>[] => [
  {
    name: 'help',
    description: 'list all available commands',
    parseArgs: noArgs,
    execute: async () => {
      const list = deps.registry.list();
      const longest = list.reduce(
        (max, def) => Math.max(max, def.name.length + 1),
        0,
      );
      const lines = [
        CommandFormatter.header('Available commands'),
        CommandFormatter.blank(),
        ...list.map((def) =>
          CommandFormatter.dashKeyValue(
            `/${def.name}`,
            def.description,
            undefined,
            longest + 2,
          ),
        ),
        CommandFormatter.blank(),
        CommandFormatter.line('use /help cmd <command> for details'),
      ];
      return CommandFormatter.ok(lines);
    },
  } satisfies CommandDef<null>,

  {
    name: 'help cmd',
    description: 'show details of a single command',
    usage: '/help cmd <command>',
    parseArgs: (rest) => requireText(rest, 'command', 128),
    execute: async (_ctx, name) => {
      const stripped = name.replace(/^\//, '');
      const def = deps.registry.findByName(stripped);
      if (!def) return CommandFormatter.error(`unknown command: ${stripped}`);
      return CommandFormatter.ok([
        CommandFormatter.header(`/${def.name} command`),
        CommandFormatter.blank(),
        CommandFormatter.dashKeyValue('description', def.description),
        CommandFormatter.dashKeyValue('usage', def.usage ?? `/${def.name}`),
      ]);
    },
  } satisfies CommandDef<string>,
];
