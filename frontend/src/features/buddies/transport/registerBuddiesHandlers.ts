import { useBuddiesStore } from '@/features/buddies/store';
import { wsClient, type Unsubscribe } from '@/shared';

export const registerBuddiesHandlers = (): Unsubscribe => {
  const store = useBuddiesStore;

  const unsubHello = wsClient.on('hello', (event) => {
    store.getState().setBuddies(event.buddies);
  });

  const unsubAdded = wsClient.on('buddy_added', (event) => {
    store.getState().addBuddy(event.buddy);
  });

  const unsubRemoved = wsClient.on('buddy_removed', (event) => {
    store.getState().removeBuddy(event.userId);
  });

  const unsubPresence = wsClient.on('buddy_presence_changed', (event) => {
    store.getState().setPresence(event.userId, event.online);
  });

  return () => {
    unsubHello();
    unsubAdded();
    unsubRemoved();
    unsubPresence();
  };
};
