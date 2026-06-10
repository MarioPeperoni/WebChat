import type {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import { container } from '@/container';
import {
  OkResponse,
  BadRequestResponse,
  getEndpointFromEvent,
} from '@/utils';

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const message = container.chatService.parse(event.body);
  if (!message) return BadRequestResponse('invalid message');

  await container.chatService.broadcast(
    event.requestContext.connectionId,
    message.content,
    getEndpointFromEvent(event),
  );
  return OkResponse();
};
