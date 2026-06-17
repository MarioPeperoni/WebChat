import type { MessageSegment } from './Message';

export type CommandStatus = 'ok' | 'error';

export type CommandResult = {
  status: CommandStatus;
  lines: MessageSegment[][];
};
