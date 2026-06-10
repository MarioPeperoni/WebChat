import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

export interface WebSocketConnectEvent extends APIGatewayProxyWebsocketEventV2 {
  headers?: Record<string, string | undefined>;
  multiValueHeaders?: Record<string, string[] | undefined>;
}

export interface ClientInfo {
  ip: string;
  userAgent: string;
}

export function extractClientInfo(event: WebSocketConnectEvent): ClientInfo {
  const headers = event.headers ?? {};
  const forwarded = headers['x-forwarded-for'] ?? headers['X-Forwarded-For'];
  const ip = forwarded?.split(',')[0]?.trim() ?? '';
  const userAgent = headers['user-agent'] ?? headers['User-Agent'] ?? '';
  return { ip, userAgent };
}
