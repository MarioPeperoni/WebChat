import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
  paginateQuery,
} from '@aws-sdk/lib-dynamodb';

import { toBuddyEdge, toBuddyOfEdge } from '@/repositories/buddies/mapper';

export interface BuddyEdge {
  buddyId: string;
  addedAt: string;
}

export interface BuddyOfEdge {
  ownerId: string;
  addedAt: string;
}

export class BuddiesRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async add(ownerId: string, buddyId: string, addedAt: string): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `USER#${ownerId}`,
          sk: `BUDDY#${buddyId}`,
          buddyId,
          addedAt,
        },
      }),
    );
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `USER#${buddyId}`,
          sk: `BUDDY_OF#${ownerId}`,
          ownerId,
          addedAt,
        },
      }),
    );
  }

  async remove(ownerId: string, buddyId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${ownerId}`, sk: `BUDDY#${buddyId}` },
      }),
    );
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${buddyId}`, sk: `BUDDY_OF#${ownerId}` },
      }),
    );
  }

  async listBuddies(ownerId: string): Promise<BuddyEdge[]> {
    return this.listEdges(ownerId, 'BUDDY#', toBuddyEdge);
  }

  async listOwners(buddyId: string): Promise<BuddyOfEdge[]> {
    return this.listEdges(buddyId, 'BUDDY_OF#', toBuddyOfEdge);
  }

  private async listEdges<T>(
    userId: string,
    skPrefix: string,
    map: (item: Record<string, unknown>) => T | null,
  ): Promise<T[]> {
    const pages = paginateQuery(
      { client: this.client },
      {
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':prefix': skPrefix,
        },
      },
    );
    const out: T[] = [];
    for await (const page of pages) {
      for (const item of page.Items ?? []) {
        const mapped = map(item);
        if (mapped) out.push(mapped);
      }
    }
    return out;
  }
}
