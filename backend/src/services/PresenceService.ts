import type { ConnectionsRepository } from '@/repositories';

export class PresenceService {
  constructor(private readonly connections: ConnectionsRepository) {}

  async register(connectionId: string): Promise<void> {
    await this.connections.add(connectionId);
  }

  async unregister(connectionId: string): Promise<void> {
    await this.connections.remove(connectionId);
  }
}
