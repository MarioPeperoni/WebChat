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
    description: typeof item.description === 'string' ? item.description : null,
    messagesSent: typeof item.messagesSent === 'number' ? item.messagesSent : 0,
    metadata: item.metadata as UserMetadata,
  };
}
