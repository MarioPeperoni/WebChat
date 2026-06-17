import type {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import { container } from '@/container';
import { OkResponse, getEndpointFromEvent } from '@/utils';

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const meta = await container.connectionsRepository.lookup(
    event.requestContext.connectionId,
  );
  if (!meta) return OkResponse();

  await container.commandService.dispatch(
    meta.connectionId,
    meta.userId,
    event.body,
    getEndpointFromEvent(event),
  );
  return OkResponse();
};
