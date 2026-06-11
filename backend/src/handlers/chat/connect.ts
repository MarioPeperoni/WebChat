import type { APIGatewayProxyResultV2 } from 'aws-lambda';

import { container } from '@/container';
import {
  OkResponse,
  BadRequestResponse,
  getEndpointFromEvent,
  extractPresence,
  extractUserId,
  type WebSocketConnectEvent,
} from '@/utils';

export const handler = async (
  event: WebSocketConnectEvent,
): Promise<APIGatewayProxyResultV2> => {
  const userId = extractUserId(event);
  if (!userId) return BadRequestResponse('userId is required');

  const presence = extractPresence(event);

  await container.presenceService.register(
    event.requestContext.connectionId,
    userId,
    presence,
    getEndpointFromEvent(event),
  );
  return OkResponse();
};
