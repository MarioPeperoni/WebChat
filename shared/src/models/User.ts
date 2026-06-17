export type UserPublic = {
  userId: string;
  name: string;
  color: string;
  description: string | null;
};

export type UserMetadata = {
  firstSeenAt: string;
  lastSeenAt: string;
  country: string | null;
  lastIp: string | null;
  lastUserAgent: string | null;
};

export type User = UserPublic & {
  messagesSent: number;
  metadata: UserMetadata;
};
