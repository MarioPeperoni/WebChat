import { useEffect, useRef, type KeyboardEvent } from 'react';

import { useAutoFocus } from '@/features/chat/hooks/useAutoFocus';
import { useSendMessage } from '@/features/chat/hooks/useSendMessage';
import { useChatStore, useInputDraftStore } from '@/features/chat/store';
import { MAX_MESSAGE_LENGTH } from '@/shared/config';

import s from '@/features/chat/components/MessageInput/MessageInput.module.css';

export const MessageInput = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messages = useChatStore((s) => s.messages);
  const canSend = useChatStore(
    (s) => s.status === 'active' || s.status === 'syncing',
  );
  const draft = useInputDraftStore((s) => s.draft);
  const draftSeq = useInputDraftStore((s) => s.seq);
  const consumeDraft = useInputDraftStore((s) => s.consume);
  const { send, isSending } = useSendMessage();

  useAutoFocus(inputRef, [messages]);

  useEffect(() => {
    if (draft === null) return;
    const el = inputRef.current;
    if (!el) return;
    el.value = draft;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
    consumeDraft();
  }, [draft, draftSeq, consumeDraft]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    send(event.currentTarget.value);
    event.currentTarget.value = '';
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className={s.form}>
      <label htmlFor="chat-input" className={s.srOnly}>
        Type your message
      </label>
      <input
        autoFocus
        ref={inputRef}
        id="chat-input"
        type="text"
        placeholder="Type a message..."
        className={s.input}
        maxLength={MAX_MESSAGE_LENGTH}
        disabled={isSending || !canSend}
        onKeyDown={handleKeyDown}
      />
    </form>
  );
};
