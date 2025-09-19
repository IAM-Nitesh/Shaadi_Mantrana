import logger from './logger';
import { getLastRequestId, withRequestIdMessage } from './request-context';

interface ClientErrorOptions {
  surfaceToUser?: boolean; // whether to return a user-friendly string including request id
  defaultMessage?: string;
}

export function logClientError(err: unknown, options: ClientErrorOptions = {}) {
  const { surfaceToUser = false, defaultMessage = 'Something went wrong' } = options;
  const requestId = getLastRequestId();

  const meta: any = { request_id: requestId };
  if (err instanceof Error) {
    meta.error = { message: err.message, stack: err.stack, name: err.name };
  } else {
    meta.error = { value: err };
  }

  logger.error(meta, 'client_error');

  if (surfaceToUser) {
    return withRequestIdMessage(defaultMessage);
  }
  return undefined;
}

export function buildUserErrorMessage(base: string) {
  return withRequestIdMessage(base);
}
