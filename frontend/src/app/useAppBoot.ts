import { useEffect } from 'react';

import { registerChatHandlers, useChatStore } from '@/features/chat';
import { registerCommandHandlers } from '@/features/commands';
import { identityService, registerIdentityHandlers } from '@/features/identity';
import { registerPresenceHandlers } from '@/features/presence';
import { registerRoomHandlers } from '@/features/room';
import { env, wsClient } from '@/shared';

export const useAppBoot = () => {
  const isIdle = useChatStore((s) => s.status === 'idle');

  useEffect(() => {
    if (!isIdle) return;
    const start = () => useChatStore.getState().start();
    document.addEventListener('pointerdown', start, { once: true });
    document.addEventListener('keydown', start, { once: true });
    return () => {
      document.removeEventListener('pointerdown', start);
      document.removeEventListener('keydown', start);
    };
  }, [isIdle]);

  useEffect(() => {
    if (isIdle) return;
    const userId = identityService.getUserId();
    const unsubChat = registerChatHandlers(userId);
    const unsubIdentity = registerIdentityHandlers(userId);
    const unsubPresence = registerPresenceHandlers();
    const unsubRoom = registerRoomHandlers();
    const unsubCommands = registerCommandHandlers();
    const disconnect = wsClient.connect(env.VITE_WS_URL, userId);
    return () => {
      disconnect();
      unsubChat();
      unsubIdentity();
      unsubPresence();
      unsubRoom();
      unsubCommands();
    };
  }, [isIdle]);
};
