import { createHash } from 'node:crypto';
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator';

import type { User, UserPublic } from '@webchat/shared';

import type { ConnectPresence } from '@/models';

const COLORS = [
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
  '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea',
  '#c026d3', '#db2777', '#e11d48', '#65a30d', '#0284c7',
];

export class UserService {
  generateInitialProfile(
    userId: string,
    presence: ConnectPresence,
    now: string,
  ): User {
    const fingerprint = createHash('sha256').update(userId).digest();
    const seed = fingerprint.readUInt32BE(0);

    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: ' ',
      style: 'capital',
      seed,
    });

    const color = COLORS[fingerprint.readUInt16BE(4) % COLORS.length]!;

    return {
      userId,
      name,
      color,
      metadata: {
        firstSeenAt: now,
        lastSeenAt: now,
        country: presence.country,
        lastIp: presence.ip,
        lastUserAgent: presence.userAgent,
      },
    };
  }

  static toPublic(user: User): UserPublic {
    return { userId: user.userId, name: user.name, color: user.color };
  }
}
