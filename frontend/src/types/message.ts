import type { User } from './user';

export type Message = {
  user: User;
  content: string;
};
