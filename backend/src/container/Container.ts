import { ApiGatewayManagementApiClient } from '@aws-sdk/client-apigatewaymanagementapi';

import {
  DynamoDbConnectionsRepository,
  type ConnectionsRepository,
} from '@/repositories';
import { UserService, PresenceService, ChatService } from '@/services';
import { logger, type Logger } from '@/utils/logging';

class Container {
  private _connectionsRepository?: ConnectionsRepository;
  private _userService?: UserService;
  private _presenceService?: PresenceService;
  private _chatService?: ChatService;

  get logger(): Logger {
    return logger;
  }

  get connectionsRepository(): ConnectionsRepository {
    if (!this._connectionsRepository) {
      const tableName = process.env.CONNECTIONS_TABLE;
      if (!tableName) throw new Error('CONNECTIONS_TABLE env var is required');
      this._connectionsRepository = new DynamoDbConnectionsRepository(tableName);
    }
    return this._connectionsRepository;
  }

  get userService(): UserService {
    if (!this._userService) this._userService = new UserService();
    return this._userService;
  }

  get presenceService(): PresenceService {
    if (!this._presenceService) {
      this._presenceService = new PresenceService(this.connectionsRepository);
    }
    return this._presenceService;
  }

  get chatService(): ChatService {
    if (!this._chatService) {
      this._chatService = new ChatService(
        this.connectionsRepository,
        (endpoint) => new ApiGatewayManagementApiClient({ endpoint }),
        this.logger,
      );
    }
    return this._chatService;
  }
}

export const container = new Container();
