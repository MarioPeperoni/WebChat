import { useIdentityStore } from '@/features/identity/store';
import { wsClient, type Unsubscribe } from '@/shared';

export const registerIdentityHandlers = (ownUserId: string): Unsubscribe => {
  const store = useIdentityStore;

  const unsubHello = wsClient.on('hello', (event) => {
    store.getState().setUser(event.user);
  });

  const unsubUpdated = wsClient.on('user_updated', (event) => {
    if (event.user.userId === ownUserId) store.getState().setUser(event.user);
  });

  return () => {
    unsubHello();
    unsubUpdated();
  };
};
