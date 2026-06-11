import {
  UsersRepository,
  PresenceRepository,
  ConnectionsRepository,
} from '@/repositories';
import {
  UserService,
  PresenceService,
  ChatService,
  WebSocketBroadcaster,
} from '@/services';
import { logger, type Logger } from '@/utils/logging';

class Container {
  private readonly tableName: string;

  private _usersRepository?: UsersRepository;
  private _presenceRepository?: PresenceRepository;
  private _connectionsRepository?: ConnectionsRepository;
  private _userService?: UserService;
  private _presenceService?: PresenceService;
  private _chatService?: ChatService;
  private _webSocketBroadcaster?: WebSocketBroadcaster;

  constructor() {
    const name = process.env.CHAT_TABLE;
    if (!name) throw new Error('CHAT_TABLE env var is required');
    this.tableName = name;
  }

  get logger(): Logger {
    return logger;
  }

  get usersRepository(): UsersRepository {
    if (!this._usersRepository) {
      this._usersRepository = new UsersRepository(this.tableName);
    }
    return this._usersRepository;
  }

  get presenceRepository(): PresenceRepository {
    if (!this._presenceRepository) {
      this._presenceRepository = new PresenceRepository(this.tableName);
    }
    return this._presenceRepository;
  }

  get connectionsRepository(): ConnectionsRepository {
    if (!this._connectionsRepository) {
      this._connectionsRepository = new ConnectionsRepository(this.tableName);
    }
    return this._connectionsRepository;
  }

  get userService(): UserService {
    if (!this._userService) this._userService = new UserService();
    return this._userService;
  }

  get webSocketBroadcaster(): WebSocketBroadcaster {
    if (!this._webSocketBroadcaster) {
      this._webSocketBroadcaster = new WebSocketBroadcaster(
        this.connectionsRepository,
        this.logger,
      );
    }
    return this._webSocketBroadcaster;
  }

  get chatService(): ChatService {
    if (!this._chatService) {
      this._chatService = new ChatService(
        this.usersRepository,
        this.connectionsRepository,
        this.webSocketBroadcaster,
        this.logger,
      );
    }
    return this._chatService;
  }

  get presenceService(): PresenceService {
    if (!this._presenceService) {
      this._presenceService = new PresenceService(
        this.usersRepository,
        this.presenceRepository,
        this.connectionsRepository,
        this.userService,
        this.chatService,
        this.webSocketBroadcaster,
        this.logger,
      );
    }
    return this._presenceService;
  }

}

export const container = new Container();
