import type { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';

import type { ConnectPresence } from '@/models';

export interface WebSocketConnectEvent extends APIGatewayProxyWebsocketEventV2 {
  headers?: Record<string, string | undefined>;
  multiValueHeaders?: Record<string, string[] | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
}

export function extractUserId(event: WebSocketConnectEvent): string | null {
  return event.queryStringParameters?.userId ?? null;
}

export function extractPresence(event: WebSocketConnectEvent): ConnectPresence {
  const headers = event.headers ?? {};
  const forwarded = headers['x-forwarded-for'] ?? headers['X-Forwarded-For'];
  const ip = forwarded?.split(',')[0]?.trim() || null;
  const userAgent = headers['user-agent'] ?? headers['User-Agent'] ?? null;
  const country =
    headers['cloudfront-viewer-country'] ??
    headers['CloudFront-Viewer-Country'] ??
    null;
  return { ip, userAgent, country };
}
