import type { CommandResult } from './Command';
import type { UserPublic } from './User';

export type MessageSegment = {
  text: string;
  color?: string;
  bold?: boolean;
};

export type SystemMessageEvent = 'user_joined' | 'user_left';

export type ChatUserMessage = {
  kind: 'user';
  user: UserPublic;
  content: string;
  timestamp: string;
};

export type ChatSystemMessage = {
  kind: 'system';
  event: SystemMessageEvent;
  segments: MessageSegment[];
  timestamp: string;
};

export type ChatCommandMessage = {
  kind: 'command';
  commandId: string;
  prompt: string;
  result: CommandResult | null;
  timestamp: string;
};

export type ChatMessage = ChatUserMessage | ChatSystemMessage | ChatCommandMessage;
