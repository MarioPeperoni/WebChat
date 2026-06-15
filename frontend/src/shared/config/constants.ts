export const MAX_MESSAGE_LENGTH = 256;

export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30000;

export const STORAGE_KEYS = {
  userId: 'webchat:userId',
  soundMuted: 'webchat:soundMuted',
} as const;
