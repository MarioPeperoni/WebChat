import type {
  ChatCommandMessage,
  ChatMessage,
  MessageSegment,
} from '@webchat/shared';

import { useBuddiesStore } from '@/features/buddies/store';

import s from '@/features/chat/components/MessageItem/MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage;
  ownUserId: string;
}

export const MessageItem = ({ message, ownUserId }: MessageItemProps) => {
  const isBuddy = useBuddiesStore((b) =>
    message.kind === 'user' ? b.isBuddy(message.user.userId) : false,
  );

  if (message.kind === 'system') {
    return (
      <li className={s.system}>
        {message.segments.map((seg, i) => (
          <Segment key={i} segment={seg} />
        ))}
      </li>
    );
  }

  if (message.kind === 'command') {
    return <CommandBlock message={message} />;
  }

  return (
    <li>
      <strong>
        <span
          style={{ color: message.user.color }}
          aria-label={`Message from ${message.user.name}`}
        >
          {isBuddy && (
            <span className={s.buddyMark} title="buddy">
              ★
            </span>
          )}
          {message.user.name}
          {message.user.userId === ownUserId ? ' (You)' : ''}:
        </span>{' '}
      </strong>
      {message.content}
    </li>
  );
};

const CommandBlock = ({ message }: { message: ChatCommandMessage }) => (
  <li className={s.command}>
    <div className={s.commandPrompt}>
      <span className={s.commandPromptArrow}>&gt;</span> {message.prompt}
    </div>
    <div className={s.commandResult}>
      {message.result === null ? (
        <span className={s.commandPending}>...</span>
      ) : (
        message.result.lines.map((line, i) => (
          <div key={i} className={s.commandLine}>
            {line.length === 0 ? ' ' : line.map((seg, j) => (
              <Segment key={j} segment={seg} />
            ))}
          </div>
        ))
      )}
    </div>
  </li>
);

const Segment = ({ segment }: { segment: MessageSegment }) => (
  <span
    style={{
      color: segment.color,
      fontWeight: segment.bold ? 'bold' : undefined,
    }}
  >
    {segment.text}
  </span>
);
