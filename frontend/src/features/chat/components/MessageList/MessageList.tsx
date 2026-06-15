import { useRef } from 'react';

import { MessageItem } from '@/features/chat/components/MessageItem';
import { useAutoScroll } from '@/features/chat/hooks/useAutoScroll';
import { useChatStore } from '@/features/chat/store';
import { identityService, useIdentityStore } from '@/features/identity';

import s from '@/features/chat/components/MessageList/MessageList.module.css';

export const MessageList = () => {
  const listRef = useRef<HTMLUListElement | null>(null);
  const status = useChatStore((s) => s.status);
  const messages = useChatStore((s) => s.messages);
  const user = useIdentityStore((s) => s.user);
  const ownUserId = identityService.getUserId();

  useAutoScroll(listRef, [messages]);

  return (
    <ul ref={listRef} className={s.list}>
      <li>
        {status === 'idle' ? (
          <>
            Welcome to <span className={s.brand}>WebChat</span>. Click anywhere to enter the
            chatroom...
          </>
        ) : user ? (
          <>
            Connected to the chatroom as{' '}
            <strong style={{ color: user.color }}>{user.name}</strong>.
          </>
        ) : (
          'Connecting you to the chatroom...'
        )}
      </li>
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} ownUserId={ownUserId} />
      ))}
    </ul>
  );
};
