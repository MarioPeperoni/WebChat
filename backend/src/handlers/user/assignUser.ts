import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import { container } from '@/container';
import { OkResponse, corsHeaders } from '@/utils/http';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const forwarded = event.headers['x-forwarded-for'];
  const ip =
    forwarded?.split(',')[0]?.trim() ?? event.requestContext.http.sourceIp;
  const userAgent = event.headers['user-agent'] ?? '';

  const user = container.userService.assignFor(ip, userAgent);
  return OkResponse(user, corsHeaders(event.headers.origin));
};
