import { useEffect, useRef, useState, useTransition } from 'react';

import OnlineCount from '../OnlineCount/OnlineCount';

import './ChatWindow.css';

import type { ChatMessage, UserPublic } from '@webchat/shared';

const MAX_MESSAGE_LENGTH = 256;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const USER_ID_STORAGE_KEY = 'webchat:userId';

function ensureUserId(): string {
  const existing = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem(USER_ID_STORAGE_KEY, fresh);
  return fresh;
}

const ChatWindow = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<UserPublic | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>();
  const [userCount, setUserCount] = useState(0);
  const [ready, setReady] = useState(false);

  const [isSending, startSending] = useTransition();

  useEffect(() => {
    const userId = ensureUserId();
    let cancelled = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;

      const socket = new WebSocket(
        `${import.meta.env.VITE_WS_URL}?userId=${userId}`,
      );
      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        socket.send(JSON.stringify({ action: 'hello' }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'hello':
            setUser(data.user);
            setUserCount(data.count);
            setReady(true);
            break;
          case 'users_count':
            setUserCount(data.count);
            break;
          case 'user_updated':
            if (data.user.userId === userId) setUser(data.user);
            break;
          case 'message':
            setMessages((prev) => [...(prev ?? []), data.data]);
            break;
        }
      };

      socket.onclose = () => {
        setReady(false);
        if (cancelled) return;
        const delay = Math.min(
          RECONNECT_MAX_MS,
          RECONNECT_BASE_MS * 2 ** attempt,
        );
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    inputRef.current?.focus();
  }, [messages]);

  const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    startSending(() => {
      const content = event.currentTarget.value.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!content) return;

      socket.send(
        JSON.stringify({
          action: 'sendmessage',
          content,
        }),
      );

      event.currentTarget.value = '';
    });
  };

  return (
    <section className="chat-container">
      <OnlineCount count={userCount} />
      <ul className="message-list">
        <li>
          {ready && user ? (
            <>
              Connected to the chatroom as{' '}
              <strong style={{ color: user.color }}>{user.name}</strong>.
            </>
          ) : (
            'Connecting to chatroom...'
          )}
        </li>
        {messages &&
          messages.map((msg, index) =>
            msg.kind === 'system' ? (
              <li key={index} className="message-system">
                {msg.segments.map((seg, i) => (
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
            ) : (
              <li key={index}>
                <strong>
                  <span
                    style={{ color: msg.user.color }}
                    aria-label={`Message from ${msg.user.name}`}
                  >
                    {msg.user.name}
                    {user?.userId === msg.user.userId ? ' (You)' : ''}:
                  </span>{' '}
                </strong>
                {msg.content}
              </li>
            ),
          )}
        <div ref={messagesEndRef} aria-hidden={true} />
      </ul>
      <form onSubmit={(e) => e.preventDefault()} className="chat-form">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <input
          autoFocus
          ref={inputRef}
          id="chat-input"
          type="text"
          placeholder="Type a message..."
          className="message-input"
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isSending || !ready}
          onKeyDown={handleSendMessage}
        />
      </form>
    </section>
  );
};

export default ChatWindow;
