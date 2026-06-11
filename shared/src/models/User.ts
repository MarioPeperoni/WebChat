export type UserPublic = {
  userId: string;
  name: string;
  color: string;
};

export type UserMetadata = {
  firstSeenAt: string;
  lastSeenAt: string;
  country: string | null;
  lastIp: string | null;
  lastUserAgent: string | null;
};

export type User = UserPublic & {
  metadata: UserMetadata;
};
