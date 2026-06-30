import type {
  ConnectionsRepository,
  PresenceRepository,
  UsersRepository,
} from '@/repositories';
import type {
  BuddiesService,
  PresenceService,
  RoomsService,
  WebSocketBroadcaster,
} from '@/services';
import { buildBuddyCommands } from '@/services/commands/buddyCommands';
import { CommandRegistry } from '@/services/commands/CommandRegistry';
import { buildHelpCommands } from '@/services/commands/helpCommands';
import { buildProfileCommands } from '@/services/commands/profileCommands';
import { buildRoomCommands } from '@/services/commands/roomCommands';

export interface RegistryDeps {
  users: UsersRepository;
  presence: PresenceRepository;
  connections: ConnectionsRepository;
  rooms: RoomsService;
  buddies: BuddiesService;
  presenceService: PresenceService;
  broadcaster: WebSocketBroadcaster;
}

export function buildRegistry(deps: RegistryDeps): CommandRegistry {
  const registry = new CommandRegistry();

  registry.registerAll(
    buildProfileCommands({
      users: deps.users,
      presence: deps.presence,
      connections: deps.connections,
      presenceService: deps.presenceService,
      buddies: deps.buddies,
    }),
  );

  registry.registerAll(
    buildRoomCommands({
      rooms: deps.rooms,
      users: deps.users,
      presence: deps.presence,
      connections: deps.connections,
      presenceService: deps.presenceService,
      broadcaster: deps.broadcaster,
    }),
  );

  registry.registerAll(
    buildBuddyCommands({
      buddies: deps.buddies,
      users: deps.users,
      presence: deps.presence,
      connections: deps.connections,
      presenceService: deps.presenceService,
    }),
  );

  registry.registerAll(buildHelpCommands({ registry }));

  return registry;
}
