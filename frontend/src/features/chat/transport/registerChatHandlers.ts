import type { ChatMessage } from '@webchat/shared';

import { useChatStore } from '@/features/chat/store';
import { soundPlayer, wsClient, type Unsubscribe } from '@/shared';

const playMessageSound = (message: ChatMessage, ownUserId: string): void => {
  if (message.kind === 'system') {
    if (message.event === 'user_joined') soundPlayer.play('userJoined');
    else if (message.event === 'user_left') soundPlayer.play('userLeft');
    return;
  }
  if (message.user.userId !== ownUserId) soundPlayer.play('messageReceived');
};

export const registerChatHandlers = (ownUserId: string): Unsubscribe => {
  const store = useChatStore;
  const tracker = { wasOnline: false };

  const unsubHello = wsClient.on('hello', () => {
    store.getState().markActive();
    if (!tracker.wasOnline) {
      soundPlayer.play('connect');
      tracker.wasOnline = true;
    }
  });

  const unsubMessage = wsClient.on('message', (event) => {
    const message = event.data;
    store.getState().addMessage(message);
    playMessageSound(message, ownUserId);
    if (
      message.kind === 'user' &&
      message.user.userId === ownUserId &&
      store.getState().status === 'syncing'
    ) {
      store.getState().markActive();
    }
  });

  const unsubStatus = wsClient.onStatus((status) => {
    if (status !== 'disconnected') return;
    store.getState().markEstablishing();
    if (tracker.wasOnline) {
      soundPlayer.play('disconnect');
      tracker.wasOnline = false;
    }
  });

  return () => {
    unsubHello();
    unsubMessage();
    unsubStatus();
  };
};
