import { useCallback, useTransition } from 'react';

import { chatService } from '@/features/chat/services';
import { commandService } from '@/features/commands';
import { MAX_MESSAGE_LENGTH } from '@/shared/config';

export const useSendMessage = () => {
  const [isSending, startTransition] = useTransition();

  const send = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (commandService.isCommand(trimmed)) {
      startTransition(() => {
        commandService.send(trimmed);
      });
      return;
    }
    const content = trimmed.slice(0, MAX_MESSAGE_LENGTH);
    startTransition(() => {
      chatService.send(content);
    });
  }, []);

  return { send, isSending };
};
