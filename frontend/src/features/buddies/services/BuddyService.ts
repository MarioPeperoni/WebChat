import { commandService } from '@/features/commands';

class BuddyService {
  add(nickOrUserId: string): void {
    commandService.send(`/buddy add ${nickOrUserId}`);
  }

  remove(nickOrUserId: string): void {
    commandService.send(`/buddy remove ${nickOrUserId}`);
  }
}

export const buddyService = new BuddyService();
