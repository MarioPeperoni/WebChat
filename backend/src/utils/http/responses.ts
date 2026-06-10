import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';

const JSON_HEADERS = {
  'content-type': 'application/json',
};

function jsonBody(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body);
}

function build(
  statusCode: number,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): APIGatewayProxyStructuredResultV2 {
  if (body === undefined) {
    return extraHeaders
      ? { statusCode, headers: extraHeaders, body: '' }
      : { statusCode, body: '' };
  }
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...extraHeaders },
    body: jsonBody(body),
  };
}

export const OkResponse = (body?: unknown, extraHeaders?: Record<string, string>) =>
  build(StatusCodes.OK, body, extraHeaders);
export const CreatedResponse = (body: unknown, extraHeaders?: Record<string, string>) =>
  build(StatusCodes.CREATED, body, extraHeaders);
export const NoContentResponse = (extraHeaders?: Record<string, string>) =>
  build(StatusCodes.NO_CONTENT, undefined, extraHeaders);
export const BadRequestResponse = (message = 'Bad request') =>
  build(StatusCodes.BAD_REQUEST, { message });
export const NotFoundResponse = (message = 'Not found') =>
  build(StatusCodes.NOT_FOUND, { message });
export const InternalServerErrorResponse = (message = 'Internal server error') =>
  build(StatusCodes.INTERNAL_SERVER_ERROR, { message });
