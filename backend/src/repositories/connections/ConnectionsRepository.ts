import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  paginateQuery,
} from '@aws-sdk/lib-dynamodb';

import type { ConnectionMeta } from '@/models';
import { toConnectionMeta } from '@/repositories/connections/mapper';

export class ConnectionsRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async add(meta: ConnectionMeta): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `CONN#${meta.connectionId}`,
          sk: 'META',
          connectionId: meta.connectionId,
          userId: meta.userId,
          roomId: meta.roomId,
        },
      }),
    );
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `ROOM#${meta.roomId}`,
          sk: `CONN#${meta.connectionId}`,
          connectionId: meta.connectionId,
          userId: meta.userId,
          roomId: meta.roomId,
        },
      }),
    );
  }

  async lookup(connectionId: string): Promise<ConnectionMeta | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `CONN#${connectionId}`, sk: 'META' },
      }),
    );
    return toConnectionMeta(result.Item);
  }

  async remove(connectionId: string, roomId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `CONN#${connectionId}`, sk: 'META' },
      }),
    );
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM#${roomId}`, sk: `CONN#${connectionId}` },
      }),
    );
  }

  async listConnectionIds(roomId: string): Promise<string[]> {
    const pages = paginateQuery(
      { client: this.client },
      {
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `ROOM#${roomId}`,
          ':prefix': 'CONN#',
        },
        ProjectionExpression: 'connectionId',
      },
    );

    const ids: string[] = [];
    for await (const page of pages) {
      for (const item of page.Items ?? []) {
        if (typeof item.connectionId === 'string') ids.push(item.connectionId);
      }
    }
    return ids;
  }
}
