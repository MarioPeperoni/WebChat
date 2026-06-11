import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  GetCommand,
  paginateScan,
} from '@aws-sdk/lib-dynamodb';

import type { User } from '@webchat/shared';

export interface ConnectionsRepository {
  add(connectionId: string, user: User): Promise<void>;
  remove(connectionId: string): Promise<void>;
  getUser(connectionId: string): Promise<User | null>;
  listAll(): Promise<string[]>;
}

const TTL_SECONDS = 60 * 60 * 2;

export class DynamoDbConnectionsRepository implements ConnectionsRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async add(connectionId: string, user: User): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          connectionId,
          nickname: user.name,
          color: user.color,
          expiresAt: Math.floor(Date.now() / 1000) + TTL_SECONDS,
        },
      }),
    );
  }

  async remove(connectionId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { connectionId },
      }),
    );
  }

  async getUser(connectionId: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { connectionId },
        ProjectionExpression: 'nickname, color',
      }),
    );
    const item = result.Item;
    if (!item || typeof item.nickname !== 'string' || typeof item.color !== 'string') {
      return null;
    }
    return { name: item.nickname, color: item.color };
  }

  async listAll(): Promise<string[]> {
    const paginator = paginateScan(
      { client: this.client },
      {
        TableName: this.tableName,
        ProjectionExpression: 'connectionId',
      },
    );

    const ids: string[] = [];
    for await (const page of paginator) {
      for (const item of page.Items ?? []) {
        if (typeof item.connectionId === 'string') ids.push(item.connectionId);
      }
    }
    return ids;
  }
}
