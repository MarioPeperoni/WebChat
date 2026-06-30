import { RemoveBuddyAction, UserInfoAction } from '@/features/buddies/components/actions';
import { useBuddiesStore } from '@/features/buddies/store';
import { useChatStore } from '@/features/chat';
import { OfflineNotice } from '@/features/sidebar/components/OfflineNotice';
import { UserRow } from '@/features/users';

import s from '@/features/buddies/components/BuddiesPanel/BuddiesPanel.module.css';

export const BuddiesPanel = () => {
  const status = useChatStore((s) => s.status);
  const buddies = useBuddiesStore((s) => s.buddies);

  if (status !== 'active' && status !== 'syncing') {
    return <OfflineNotice />;
  }

  if (buddies.length === 0) {
    return (
      <div className={s.empty}>
        No buddies yet.
        <br />
        Hover a user and click <strong>+</strong>.
      </div>
    );
  }

  const sorted = [...buddies].sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <ul className={s.list}>
      {sorted.map((buddy) => (
        <UserRow
          key={buddy.userId}
          user={buddy}
          online={buddy.online}
          actions={
            <>
              <UserInfoAction nick={buddy.name} />
              <RemoveBuddyAction nick={buddy.name} />
            </>
          }
        />
      ))}
    </ul>
  );
};
