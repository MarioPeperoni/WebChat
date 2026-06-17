import type { CommandResult, MessageSegment } from '@webchat/shared';

const LABEL_WIDTH = 15;
const DASH_LABEL_WIDTH = 14;

export class CommandFormatter {
  static ok(lines: MessageSegment[][]): CommandResult {
    return { status: 'ok', lines };
  }

  static error(message: string): CommandResult {
    return { status: 'error', lines: [[{ text: message, color: '#dc2626' }]] };
  }

  static header(text: string): MessageSegment[] {
    return [{ text, bold: true }];
  }

  static keyValue(
    key: string,
    value: string,
    color?: string,
    width: number = LABEL_WIDTH,
  ): MessageSegment[] {
    return [{ text: formatLabel(key, width) }, color ? { text: value, color } : { text: value }];
  }

  static keyValueSegment(
    key: string,
    value: MessageSegment,
    width: number = LABEL_WIDTH,
  ): MessageSegment[] {
    return [{ text: formatLabel(key, width) }, value];
  }

  static dashKeyValue(
    key: string,
    value: string,
    color?: string,
    width: number = DASH_LABEL_WIDTH,
  ): MessageSegment[] {
    const padded = `${key}:`.padEnd(width, ' ');
    return [{ text: `- ${padded} `, bold: true }, color ? { text: value, color } : { text: value }];
  }

  static line(text: string, color?: string, bold?: boolean): MessageSegment[] {
    return [{ text, color, bold }];
  }

  static blank(): MessageSegment[] {
    return [{ text: '' }];
  }
}

function formatLabel(key: string, width: number): string {
  const inner = `[${key}]`;
  return inner.padEnd(Math.max(width, inner.length + 2), ' ');
}
