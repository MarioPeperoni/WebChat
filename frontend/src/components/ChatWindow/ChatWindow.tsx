import { useEffect, useRef, useState, useTransition } from 'react';

import './ChatWindow.css';

import { useUser } from '../../hooks/useUser';

import type { Message } from '../../types/message';

const ChatWindow = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const user = useUser();

  const [messages, setMessages] = useState<Message[]>();

  const [ready, setReady] = useState(false);

  const [isSending, startSending] = useTransition();

  useEffect(() => {
    const wsUrl = `http://${import.meta.env.VITE_BACKEND_URL}/chat/ws`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      if (user) setReady(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [...(prevMessages || []), data]);
    };

    return () => {
      socket.close();
    };
  }, [user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    inputRef.current?.focus();
  }, [messages]);

  const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && socketRef.current && user) {
      startSending(() => {
        const messageContent = event.currentTarget.value.trim();

        if (!messageContent) return;

        const message: Message = {
          user,
          content: messageContent,
        };

        socketRef.current!.send(JSON.stringify(message));

        event.currentTarget.value = '';
      });
    }
  };

  return (
    <section className="chat-container">
      <ul className="message-list">
        <li>
          {ready ? (
            <>
              Connected to the chatroom as{' '}
              <strong style={{ color: user!.color }}>{user!.name}</strong>.
            </>
          ) : (
            'Connecting to chatroom...'
          )}
        </li>
        {messages &&
          messages.map((msg, index) => (
            <li key={index}>
              <strong>
                <span
                  style={{
                    color: msg.user.color,
                  }}
                  aria-label={`Message from ${msg.user.name}`}
                >
                  {msg.user.name} {user?.name == msg.user.name ? ' (You)' : ''}:
                </span>{' '}
              </strong>
              {msg.content}
            </li>
          ))}
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
          disabled={isSending || !user}
          onKeyDown={handleSendMessage}
        />
      </form>
    </section>
  );
};

export default ChatWindow;
