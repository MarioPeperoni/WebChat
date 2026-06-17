import { useChatStore } from '@/features/chat/store';
import { wsClient, type Unsubscribe } from '@/shared';

export const registerCommandHandlers = (): Unsubscribe => {
  const store = useChatStore;

  const unsubResult = wsClient.on('command_result', (event) => {
    store.getState().resolveCommand(event.commandId, event.result);
  });

  return () => {
    unsubResult();
  };
};
