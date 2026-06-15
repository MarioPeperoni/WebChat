import { useChatStore } from '@/features/chat/store';
import { soundPlayer, wsClient } from '@/shared';

class ChatService {
  send(content: string): void {
    wsClient.send({ action: 'sendmessage', content });
    soundPlayer.play('messageSent');
    useChatStore.getState().markSyncing();
  }
}

export const chatService = new ChatService();
