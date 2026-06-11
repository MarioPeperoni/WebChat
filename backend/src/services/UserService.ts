import { createHash } from 'node:crypto';
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator';

import type { User, UserPublic } from '@webchat/shared';

import type { ConnectPresence } from '@/models';

const COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324', '#800000', '#808000',
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
