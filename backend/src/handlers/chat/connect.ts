import type { APIGatewayProxyResultV2 } from 'aws-lambda';

import { container } from '@/container';
import {
  OkResponse,
  getEndpointFromEvent,
  extractClientInfo,
  type WebSocketConnectEvent,
} from '@/utils';

export const handler = async (
  event: WebSocketConnectEvent,
): Promise<APIGatewayProxyResultV2> => {
  const { ip, userAgent } = extractClientInfo(event);

  await container.presenceService.register(
    event.requestContext.connectionId,
    ip,
    userAgent,
    getEndpointFromEvent(event),
  );
  return OkResponse();
};
