import type { Buddy } from '@webchat/shared';

import type {
  BuddiesRepository,
  ConnectionsRepository,
  UsersRepository,
} from '@/repositories';
import { UserService } from '@/services/UserService';

export type AddBuddyResult =
  | { ok: true; buddy: Buddy }
  | { ok: false; code: 'self' | 'not_found' };

export type RemoveBuddyResult =
  | { ok: true }
  | { ok: false; code: 'self' | 'not_found' };

export class BuddiesService {
  constructor(
    private readonly buddies: BuddiesRepository,
    private readonly users: UsersRepository,
    private readonly connections: ConnectionsRepository,
  ) {}

  async addBuddy(ownerId: string, buddyId: string): Promise<AddBuddyResult> {
    if (ownerId === buddyId) return { ok: false, code: 'self' };
    const profile = await this.users.get(buddyId);
    if (!profile) return { ok: false, code: 'not_found' };
    await this.buddies.add(ownerId, buddyId, new Date().toISOString());
    const online = await this.isOnline(buddyId);
    return {
      ok: true,
      buddy: { ...UserService.toPublic(profile), online },
    };
  }

  async removeBuddy(ownerId: string, buddyId: string): Promise<RemoveBuddyResult> {
    if (ownerId === buddyId) return { ok: false, code: 'self' };
    await this.buddies.remove(ownerId, buddyId);
    return { ok: true };
  }

  async listBuddies(ownerId: string): Promise<Buddy[]> {
    const edges = await this.buddies.listBuddies(ownerId);
    if (edges.length === 0) return [];
    const profiles = await Promise.all(edges.map((e) => this.users.get(e.buddyId)));
    const onlines = await Promise.all(edges.map((e) => this.isOnline(e.buddyId)));
    const out: Buddy[] = [];
    for (let i = 0; i < edges.length; i++) {
      const profile = profiles[i];
      if (!profile) continue;
      out.push({ ...UserService.toPublic(profile), online: onlines[i]! });
    }
    return out;
  }

  async listOwnersOf(userId: string): Promise<string[]> {
    const edges = await this.buddies.listOwners(userId);
    return edges.map((e) => e.ownerId);
  }

  async isBuddyOf(ownerId: string, buddyId: string): Promise<boolean> {
    const list = await this.buddies.listBuddies(ownerId);
    return list.some((e) => e.buddyId === buddyId);
  }

  private async isOnline(userId: string): Promise<boolean> {
    const conns = await this.connections.listConnectionIdsForUser(userId);
    return conns.length > 0;
  }
}
