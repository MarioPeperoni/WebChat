import { useChatStore } from '@/features/chat/store';
import { useRoomStore } from '@/features/room/store';
import { wsClient, type Unsubscribe } from '@/shared';

export const registerRoomHandlers = (): Unsubscribe => {
  const store = useRoomStore;

  const unsubHello = wsClient.on('hello', (event) => {
    store.getState().setRoom(event.room);
  });

  const unsubChanged = wsClient.on('room_changed', (event) => {
    const current = store.getState().room;
    store.getState().setRoom(event.room);
    if (current && current.roomId !== event.room.roomId) {
      useChatStore.getState().clearMessages();
    }
  });

  return () => {
    unsubHello();
    unsubChanged();
  };
};
