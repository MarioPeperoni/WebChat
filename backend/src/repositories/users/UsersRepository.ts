import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import type { User } from '@webchat/shared';

import type { ConnectPresence, NewUserProfile } from '@/models';
import { toUser } from '@/repositories/users/mapper';

export class UsersRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async get(userId: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
      }),
    );
    return toUser(result.Item);
  }

  async create(profile: NewUserProfile): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `USER#${profile.userId}`,
          sk: 'PROFILE',
          userId: profile.userId,
          name: profile.name,
          color: profile.color,
          metadata: profile.metadata,
          activeSessions: 0,
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    );
  }

  async incrementSessions(userId: string): Promise<number> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
        UpdateExpression: 'ADD activeSessions :one',
        ExpressionAttributeValues: { ':one': 1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    return Number(result.Attributes?.activeSessions ?? 0);
  }

  async decrementSessions(userId: string): Promise<number> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
        UpdateExpression: 'ADD activeSessions :neg',
        ExpressionAttributeValues: { ':neg': -1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    return Number(result.Attributes?.activeSessions ?? 0);
  }

  async updatePresence(
    userId: string,
    presence: ConnectPresence,
    now: string,
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
        UpdateExpression:
          'SET metadata.lastSeenAt = :now, metadata.lastIp = :ip, metadata.lastUserAgent = :ua, metadata.country = :country',
        ExpressionAttributeValues: {
          ':now': now,
          ':ip': presence.ip,
          ':ua': presence.userAgent,
          ':country': presence.country,
        },
      }),
    );
  }

  async setColor(userId: string, color: string, now: string): Promise<User | null> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
        UpdateExpression: 'SET color = :color, metadata.lastSeenAt = :now',
        ExpressionAttributeValues: { ':color': color, ':now': now },
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    return toUser(result.Attributes);
  }
}
