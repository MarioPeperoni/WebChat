import { useEffect, useRef, useState, useTransition } from 'react';

import './ChatWindow.css';

import type { Message } from '../../types/message';

const ChatWindow = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>();

  const [isSending, startSending] = useTransition();

  useEffect(() => {
    const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://127.0.0.1:8000/ws/chat`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prevMessages) => [...(prevMessages || []), data]);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && socketRef.current) {
      startSending(() => {
        const messageContent = (event.target as HTMLInputElement).value.trim();

        if (!messageContent) return;

        const message: Message = {
          user: { name: 'User', color: '#000' },
          content: messageContent,
        };

        socketRef.current!.send(JSON.stringify(message));

        (event.target as HTMLInputElement).value = '';
      });
    }
  };

  return (
    <div className="chat-container">
      <ul className="message-list">
        {messages &&
          messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.user.name}:</strong> {msg.content}
            </li>
          ))}
        <div ref={messagesEndRef} />
      </ul>
      <input
        type="text"
        placeholder="Type a message..."
        className="message-input"
        disabled={isSending}
        onKeyDown={handleSendMessage}
      />
    </div>
  );
};

export default ChatWindow;
