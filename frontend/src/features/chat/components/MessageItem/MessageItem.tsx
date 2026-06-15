import type { ChatMessage } from '@webchat/shared';

import s from '@/features/chat/components/MessageItem/MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage;
  ownUserId: string;
}

export const MessageItem = ({ message, ownUserId }: MessageItemProps) => {
  if (message.kind === 'system') {
    return (
      <li className={s.system}>
        {message.segments.map((seg, i) => (
          <span
            key={i}
            style={{
              color: seg.color,
              fontWeight: seg.bold ? 'bold' : undefined,
            }}
          >
            {seg.text}
          </span>
        ))}
      </li>
    );
  }

  return (
    <li>
      <strong>
        <span
          style={{ color: message.user.color }}
          aria-label={`Message from ${message.user.name}`}
        >
          {message.user.name}
          {message.user.userId === ownUserId ? ' (You)' : ''}:
        </span>{' '}
      </strong>
      {message.content}
    </li>
  );
};
