import type { ReactNode } from 'react';
import type { UserPublic } from '@webchat/shared';

import s from '@/features/users/components/UserRow/UserRow.module.css';

interface UserRowProps {
  user: UserPublic;
  online: boolean;
  isBuddy?: boolean;
  actions?: ReactNode;
}

export const UserRow = ({ user, online, isBuddy, actions }: UserRowProps) => (
  <li className={s.row}>
    <span
      className={`${s.dot} ${online ? s.dotOnline : s.dotOffline}`}
      role="img"
      aria-label={online ? 'online' : 'offline'}
    />
    <span
      className={`${s.name} ${online ? s.nameOnline : ''}`}
      style={online ? { color: user.color } : undefined}
    >
      {user.name}
      {isBuddy && (
        <span className={s.buddyMark} title="buddy">
          ★
        </span>
      )}
    </span>
    {actions && <span className={s.actions}>{actions}</span>}
  </li>
);
