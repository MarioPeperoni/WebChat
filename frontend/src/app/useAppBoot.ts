import { useEffect } from 'react';

import { registerBuddiesHandlers } from '@/features/buddies';
import { registerChatHandlers, useChatStore } from '@/features/chat';
import { registerCommandHandlers } from '@/features/commands';
import { identityService, registerIdentityHandlers } from '@/features/identity';
import { registerRoomHandlers } from '@/features/room';
import { registerUsersHandlers } from '@/features/users';
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
    const unsubUsers = registerUsersHandlers();
    const unsubRoom = registerRoomHandlers();
    const unsubBuddies = registerBuddiesHandlers();
    const unsubCommands = registerCommandHandlers();
    const disconnect = wsClient.connect(env.VITE_WS_URL, userId);
    return () => {
      disconnect();
      unsubChat();
      unsubIdentity();
      unsubUsers();
      unsubRoom();
      unsubBuddies();
      unsubCommands();
    };
  }, [isIdle]);
};
