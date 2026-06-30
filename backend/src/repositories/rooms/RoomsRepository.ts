import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  paginateQuery,
  paginateScan,
} from '@aws-sdk/lib-dynamodb';

import type { Room, RoomSummary, RoomVisibility } from '@webchat/shared';

import { toRoom, toRoomSummary } from '@/repositories/rooms/mapper';

const ROOM_INDEX_PK = 'ROOM_INDEX#public';
const EMPTY_ROOM_TTL_SECONDS = 24 * 60 * 60;

export class RoomsRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client?: DynamoDBDocumentClient,
  ) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
  }

  async get(roomId: string): Promise<Room | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
      }),
    );
    return toRoom(result.Item);
  }

  async create(room: Omit<Room, 'memberCount'>): Promise<Room> {
    const now = room.createdAt;
    const ttl = Math.floor(Date.now() / 1000) + EMPTY_ROOM_TTL_SECONDS;
    const item: Record<string, unknown> = {
      pk: `ROOM_META#${room.roomId}`,
      sk: 'META',
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      password: room.password,
      visibility: room.visibility,
      owner: room.owner,
      color: room.color,
      createdAt: now,
      memberCount: 0,
      expiresAt: ttl,
    };
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    );
    if (room.visibility === 'public') {
      await this.putPublicIndex(room.roomId, room.name, room.password !== null, ttl);
    }
    return { ...room, memberCount: 0 };
  }

  async findByName(name: string): Promise<Room | null> {
    const pages = paginateScan(
      { client: this.client },
      {
        TableName: this.tableName,
        FilterExpression: '#n = :n AND begins_with(pk, :p)',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: { ':n': name, ':p': 'ROOM_META#' },
      },
    );
    for await (const page of pages) {
      for (const item of page.Items ?? []) {
        const room = toRoom(item);
        if (room) return room;
      }
    }
    return null;
  }

  async listPublic(): Promise<RoomSummary[]> {
    const pages = paginateQuery(
      { client: this.client },
      {
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': ROOM_INDEX_PK, ':prefix': 'ROOM#' },
      },
    );

    const summaries: RoomSummary[] = [];
    for await (const page of pages) {
      for (const item of page.Items ?? []) {
        const summary = toRoomSummary(item);
        if (summary) summaries.push(summary);
      }
    }
    return summaries;
  }

  async setName(roomId: string, name: string): Promise<Room | null> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'SET #n = :name',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: { ':name': name },
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    const room = toRoom(result.Attributes);
    if (room && room.visibility === 'public') {
      await this.putPublicIndex(roomId, name, room.password !== null);
    }
    return room;
  }

  async setDescription(
    roomId: string,
    description: string | null,
  ): Promise<Room | null> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'SET #desc = :d',
        ExpressionAttributeNames: { '#desc': 'description' },
        ExpressionAttributeValues: { ':d': description },
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    return toRoom(result.Attributes);
  }

  async setPassword(
    roomId: string,
    password: string | null,
  ): Promise<Room | null> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'SET password = :p',
        ExpressionAttributeValues: { ':p': password },
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    const room = toRoom(result.Attributes);
    if (room && room.visibility === 'public') {
      await this.syncPublicIndexPassword(roomId, password !== null);
    }
    return room;
  }

  async setVisibility(
    roomId: string,
    visibility: RoomVisibility,
  ): Promise<Room | null> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'SET visibility = :v',
        ExpressionAttributeValues: { ':v': visibility },
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      }),
    );
    const room = toRoom(result.Attributes);
    if (!room) return null;
    if (visibility === 'public') {
      await this.putPublicIndex(roomId, room.name, room.password !== null);
    } else {
      await this.removePublicIndex(roomId);
    }
    return room;
  }

  async incrementMembers(roomId: string): Promise<number> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'ADD memberCount :one REMOVE expiresAt',
        ExpressionAttributeValues: { ':one': 1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    const count = Number(result.Attributes?.memberCount ?? 0);
    await this.syncPublicIndexCount(roomId, count);
    return count;
  }

  async decrementMembers(roomId: string): Promise<number> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'ADD memberCount :neg',
        ExpressionAttributeValues: { ':neg': -1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    const count = Math.max(0, Number(result.Attributes?.memberCount ?? 0));
    if (count === 0) await this.markEmpty(roomId);
    await this.syncPublicIndexCount(roomId, count);
    return count;
  }

  private async markEmpty(roomId: string): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `ROOM_META#${roomId}`, sk: 'META' },
        UpdateExpression: 'SET expiresAt = :ttl',
        ExpressionAttributeValues: {
          ':ttl': Math.floor(Date.now() / 1000) + EMPTY_ROOM_TTL_SECONDS,
        },
      }),
    );
  }

  private async putPublicIndex(
    roomId: string,
    name: string,
    hasPassword: boolean,
    expiresAt?: number,
  ): Promise<void> {
    const item: Record<string, unknown> = {
      pk: ROOM_INDEX_PK,
      sk: `ROOM#${roomId}`,
      roomId,
      name,
      memberCount: 0,
      hasPassword,
    };
    if (expiresAt !== undefined) item.expiresAt = expiresAt;
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );
  }

  private async syncPublicIndexPassword(
    roomId: string,
    hasPassword: boolean,
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: ROOM_INDEX_PK, sk: `ROOM#${roomId}` },
        UpdateExpression: 'SET hasPassword = :h',
        ExpressionAttributeValues: { ':h': hasPassword },
        ConditionExpression: 'attribute_exists(pk)',
      }),
    ).catch(() => {});
  }

  private async removePublicIndex(roomId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: ROOM_INDEX_PK, sk: `ROOM#${roomId}` },
      }),
    );
  }

  private async syncPublicIndexCount(
    roomId: string,
    memberCount: number,
  ): Promise<void> {
    const occupied = memberCount > 0;
    const command = occupied
      ? new UpdateCommand({
          TableName: this.tableName,
          Key: { pk: ROOM_INDEX_PK, sk: `ROOM#${roomId}` },
          UpdateExpression: 'SET memberCount = :c REMOVE expiresAt',
          ExpressionAttributeValues: { ':c': memberCount },
          ConditionExpression: 'attribute_exists(pk)',
        })
      : new UpdateCommand({
          TableName: this.tableName,
          Key: { pk: ROOM_INDEX_PK, sk: `ROOM#${roomId}` },
          UpdateExpression: 'SET memberCount = :c, expiresAt = :ttl',
          ExpressionAttributeValues: {
            ':c': memberCount,
            ':ttl': Math.floor(Date.now() / 1000) + EMPTY_ROOM_TTL_SECONDS,
          },
          ConditionExpression: 'attribute_exists(pk)',
        });
    await this.client.send(command).catch(() => {
      // index row may not exist (private room) — ignore
    });
  }
}
