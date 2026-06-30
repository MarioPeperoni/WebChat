import type { UserPublic } from './User';

export type Buddy = UserPublic & {
  online: boolean;
};
