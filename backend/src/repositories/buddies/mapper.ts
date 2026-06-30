import type { BuddyEdge, BuddyOfEdge } from '@/repositories/buddies/BuddiesRepository';

export function toBuddyEdge(item: Record<string, unknown>): BuddyEdge | null {
  if (typeof item.buddyId !== 'string' || typeof item.addedAt !== 'string') {
    return null;
  }
  return { buddyId: item.buddyId, addedAt: item.addedAt };
}

export function toBuddyOfEdge(item: Record<string, unknown>): BuddyOfEdge | null {
  if (typeof item.ownerId !== 'string' || typeof item.addedAt !== 'string') {
    return null;
  }
  return { ownerId: item.ownerId, addedAt: item.addedAt };
}
