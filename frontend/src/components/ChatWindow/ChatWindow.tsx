import { useEffect, useRef, useState, useTransition } from 'react';

import OnlineCount from '../OnlineCount/OnlineCount';
import { soundPlayer } from '../../sound';

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

function resolveNetLinkStatus(
  started: boolean,
  ready: boolean,
  isSyncing: boolean,
) {
  if (!started) return 'idle' as const;
  if (!ready) return 'establishing' as const;
  if (isSyncing) return 'syncing' as const;
  return 'active' as const;
}

function playMessageSound(message: ChatMessage, ownUserId: string): void {
  if (message.kind === 'user') {
    if (message.user.userId !== ownUserId) soundPlayer.play('messageReceived');
    return;
  }
  const text = message.segments.map((s) => s.text).join('');
  if (text.includes('joined the chatroom')) soundPlayer.play('userJoined');
  else if (text.includes('left the chatroom')) soundPlayer.play('userLeft');
}

const ChatWindow = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wasOnlineRef = useRef(false);

  const [user, setUser] = useState<UserPublic | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>();
  const [userCount, setUserCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isSending, startSending] = useTransition();

  useEffect(() => {
    if (!started) return;
    const userId = ensureUserId();
    let cancelled = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;

      const socket = new WebSocket(`${import.meta.env.VITE_WS_URL}?userId=${userId}`);
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
            wasOnlineRef.current = true;
            soundPlayer.play('connect');
            break;
          case 'users_count':
            setUserCount(data.count);
            break;
          case 'user_updated':
            if (data.user.userId === userId) setUser(data.user);
            break;
          case 'message':
            setMessages((prev) => [...(prev ?? []), data.data]);
            playMessageSound(data.data, userId);
            if (
              data.data.kind === 'user' &&
              data.data.user.userId === userId
            ) {
              setIsSyncing(false);
            }
            break;
        }
      };

      socket.onclose = () => {
        setReady(false);
        setIsSyncing(false);
        if (wasOnlineRef.current) {
          wasOnlineRef.current = false;
          soundPlayer.play('disconnect');
        }
        if (cancelled) return;
        const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt);
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
  }, [started]);

  useEffect(() => {
    if (started) return;
    const start = () => setStarted(true);
    document.addEventListener('pointerdown', start, { once: true });
    document.addEventListener('keydown', start, { once: true });
    return () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
    };
  }, [started]);

  useEffect(() => {
    const list = messagesEndRef.current?.parentElement;
    if (list) list.scrollTop = list.scrollHeight;
    if (!matchMedia('(pointer: coarse)').matches) {
      inputRef.current?.focus();
    }
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
      soundPlayer.play('messageSent');
      setIsSyncing(true);

      event.currentTarget.value = '';
    });
  };

  return (
    <section className="chat-container">
      <div className="chat-titlebar">
        <span className="chat-titlebar-text">WebChat</span>
      </div>
      <ul className="message-list">
        <li>
          {!started ? (
            <>
              Welcome to <span className="brand">WebChat</span>. Click anywhere to enter the
              chatroom...
            </>
          ) : ready && user ? (
            <>
              Connected to the chatroom as{' '}
              <strong style={{ color: user.color }}>{user.name}</strong>.
            </>
          ) : (
            'Connecting you to the chatroom...'
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
      <OnlineCount
        count={userCount}
        status={resolveNetLinkStatus(started, ready, isSyncing)}
      />
    </section>
  );
};

export default ChatWindow;
