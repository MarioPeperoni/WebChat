import type { Room } from '@webchat/shared';

export type RoomFailureCode =
  | 'not_found'
  | 'already_exists'
  | 'forbidden'
  | 'global_immutable'
  | 'missing_password'
  | 'invalid_password';

export type RoomResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: RoomFailureCode };

export type RoomMutationResult = RoomResult<Room>;
