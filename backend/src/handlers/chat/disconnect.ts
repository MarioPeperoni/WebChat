import type {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import { container } from '@/container';
import { OkResponse, getEndpointFromEvent } from '@/utils';

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  await container.presenceService.unregister(
    event.requestContext.connectionId,
    getEndpointFromEvent(event),
  );
  return OkResponse();
};
