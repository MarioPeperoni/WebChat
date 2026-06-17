import { useChatStore } from '@/features/chat/store';
import { wsClient } from '@/shared';

class CommandService {
  isCommand(raw: string): boolean {
    return raw.trim().startsWith('/');
  }

  send(raw: string): void {
    const prompt = raw.trim();
    if (!prompt) return;
    const commandId = crypto.randomUUID();
    useChatStore.getState().addPendingCommand(commandId, prompt);
    wsClient.send({ action: 'command', commandId, prompt });
  }
}

export const commandService = new CommandService();
