import type { UserPublic } from '@webchat/shared';

export function toUserPublic(item: Record<string, unknown>): UserPublic | null {
  if (
    typeof item.userId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.color !== 'string'
  ) {
    return null;
  }
  return { userId: item.userId, name: item.name, color: item.color };
}
