import type { MessageSegment, User } from '@webchat/shared';

export class SystemMessageFactory {
  static joined(user: User): MessageSegment[] {
    return [
      { text: user.name, color: user.color },
      { text: ' joined the chatroom.' },
    ];
  }
}
