import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
  paginateQuery,
} from '@aws-sdk/lib-dynamodb';

import type { UserPublic } from '@webchat/shared';

import { toUserPublic } from '@/repositories/presence/mapper';

export class PresenceRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async setUserPresent(roomId: string, user: UserPublic): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `ROOM#${roomId}`,
          sk: `USER#${user.userId}`,
          userId: user.userId,
          name: user.name,
          color: user.color,
        },
      }),
    );
  }

  async removeUserPresent(roomId: string, userId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM#${roomId}`, sk: `USER#${userId}` },
      }),
    );
  }

  async listUsers(roomId: string): Promise<UserPublic[]> {
    const pages = paginateQuery(
      { client: this.client },
      {
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `ROOM#${roomId}`,
          ':prefix': 'USER#',
        },
      },
    );

    const users: UserPublic[] = [];
    for await (const page of pages) {
      for (const item of page.Items ?? []) {
        const user = toUserPublic(item);
        if (user) users.push(user);
      }
    }
    return users;
  }
}
