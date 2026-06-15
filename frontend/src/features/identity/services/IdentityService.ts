import { STORAGE_KEYS } from '@/shared/config';

class IdentityService {
  getUserId(): string {
    const existing = localStorage.getItem(STORAGE_KEYS.userId);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.userId, fresh);
    return fresh;
  }
}

export const identityService = new IdentityService();
