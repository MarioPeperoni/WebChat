import type { User } from '@webchat/shared';

export type NewUserProfile = Omit<User, 'metadata'> & {
  metadata: User['metadata'];
};

export type ConnectPresence = {
  ip: string | null;
  userAgent: string | null;
  country: string | null;
};
