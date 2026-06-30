import { useUsersStore } from '@/features/users/store';
import { wsClient, type Unsubscribe } from '@/shared';

export const registerUsersHandlers = (): Unsubscribe => {
  const store = useUsersStore;

  const unsubHello = wsClient.on('hello', (event) => {
    store.getState().setUsers(event.users);
  });

  const unsubJoined = wsClient.on('room_user_joined', (event) => {
    store.getState().addUser(event.user);
  });

  const unsubLeft = wsClient.on('room_user_left', (event) => {
    store.getState().removeUser(event.userId);
  });

  const unsubUpdated = wsClient.on('user_updated', (event) => {
    store.getState().updateUser(event.user);
  });

  const unsubRoomChanged = wsClient.on('room_changed', (event) => {
    store.getState().setUsers(event.users);
  });

  return () => {
    unsubHello();
    unsubJoined();
    unsubLeft();
    unsubUpdated();
    unsubRoomChanged();
  };
};
