import type { ConnectionMeta } from '@/models';

export function toConnectionMeta(
  item: Record<string, unknown> | undefined,
): ConnectionMeta | null {
  if (!item) return null;
  if (
    typeof item.connectionId !== 'string' ||
    typeof item.userId !== 'string' ||
    typeof item.roomId !== 'string'
  ) {
    return null;
  }
  return {
    connectionId: item.connectionId,
    userId: item.userId,
    roomId: item.roomId,
  };
}
