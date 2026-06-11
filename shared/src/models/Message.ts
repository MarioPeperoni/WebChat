import type { User } from './User';

export type MessageSegment = {
  text: string;
  color?: string;
  bold?: boolean;
};

export type ChatUserMessage = {
  kind: 'user';
  user: User;
  content: string;
  timestamp: string;
};

export type ChatSystemMessage = {
  kind: 'system';
  segments: MessageSegment[];
  timestamp: string;
};

export type ChatMessage = ChatUserMessage | ChatSystemMessage;
