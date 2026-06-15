import type { ChatSystemMessage, UserPublic } from '@webchat/shared';

export type SystemMessagePayload = Pick<ChatSystemMessage, 'event' | 'segments'>;

export class SystemMessageFactory {
  static joined(user: UserPublic): SystemMessagePayload {
    return {
      event: 'user_joined',
      segments: [
        { text: user.name, color: user.color },
        { text: ' joined the chatroom.' },
      ],
    };
  }

  static left(user: UserPublic): SystemMessagePayload {
    return {
      event: 'user_left',
      segments: [
        { text: user.name, color: user.color },
        { text: ' left the chatroom.' },
      ],
    };
  }
}
