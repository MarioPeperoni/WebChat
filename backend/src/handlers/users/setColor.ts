import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import { container } from '@/container';
import { ColorBodySchema } from '@/models';
import {
  OkResponse,
  BadRequestResponse,
  NotFoundResponse,
  safeJson,
} from '@/utils';

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const userId = event.headers['x-user-id'];
  if (!userId) return BadRequestResponse('X-User-Id header required');

  const parsed = ColorBodySchema.safeParse(safeJson(event.body));
  if (!parsed.success) return BadRequestResponse(parsed.error.issues[0]?.message ?? 'invalid body');

  const wsCallbackUrl = process.env.WS_CALLBACK_URL;
  if (!wsCallbackUrl) throw new Error('WS_CALLBACK_URL env var is required');

  const updated = await container.presenceService.updateColor(
    userId,
    parsed.data.color,
    wsCallbackUrl,
  );

  if (!updated) return NotFoundResponse('user not found');
  return OkResponse({ color: updated.color });
};
