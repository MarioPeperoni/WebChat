import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  paginateScan,
} from '@aws-sdk/lib-dynamodb';

export interface ConnectionsRepository {
  add(connectionId: string): Promise<void>;
  remove(connectionId: string): Promise<void>;
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

  async add(connectionId: string): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          connectionId,
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
