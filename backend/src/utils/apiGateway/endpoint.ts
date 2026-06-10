import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

export function getEndpointFromEvent(event: APIGatewayProxyWebsocketEventV2): string {
  const region = process.env.AWS_REGION!;
  const { apiId, stage } = event.requestContext;
  return `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;
}
