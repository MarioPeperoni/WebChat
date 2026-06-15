import { usePresenceStore } from '@/features/presence/store';
import { wsClient, type Unsubscribe } from '@/shared';

export const registerPresenceHandlers = (): Unsubscribe => {
  const store = usePresenceStore;

  const unsubHello = wsClient.on('hello', (event) => {
    store.getState().setCount(event.count);
  });

  const unsubCount = wsClient.on('users_count', (event) => {
    store.getState().setCount(event.count);
  });

  return () => {
    unsubHello();
    unsubCount();
  };
};
