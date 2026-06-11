import type { MessageSegment, UserPublic } from '@webchat/shared';

export class SystemMessageFactory {
  static joined(user: UserPublic): MessageSegment[] {
    return [
      { text: user.name, color: user.color },
      { text: ' joined the chatroom.' },
    ];
  }
}
