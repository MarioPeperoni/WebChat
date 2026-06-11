import type { User, UserMetadata } from '@webchat/shared';

export function toUser(item: Record<string, unknown> | undefined): User | null {
  if (!item) return null;
  if (
    typeof item.userId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.color !== 'string'
  ) {
    return null;
  }
  return {
    userId: item.userId,
    name: item.name,
    color: item.color,
    metadata: item.metadata as UserMetadata,
  };
}
