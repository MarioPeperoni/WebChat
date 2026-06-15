import { useCallback, useTransition } from 'react';

import { chatService } from '@/features/chat/services';
import { MAX_MESSAGE_LENGTH } from '@/shared/config';

export const useSendMessage = () => {
  const [isSending, startTransition] = useTransition();

  const send = useCallback((raw: string) => {
    const content = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!content) return;
    startTransition(() => {
      chatService.send(content);
    });
  }, []);

  return { send, isSending };
};
