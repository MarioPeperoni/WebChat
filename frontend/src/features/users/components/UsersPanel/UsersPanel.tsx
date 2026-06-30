import {
  AddBuddyAction,
  RemoveBuddyAction,
  UserInfoAction,
} from '@/features/buddies';
import { useBuddiesStore } from '@/features/buddies/store';
import { useChatStore } from '@/features/chat';
import { identityService } from '@/features/identity';
import { OfflineNotice } from '@/features/sidebar/components/OfflineNotice';
import { UserRow } from '@/features/users/components/UserRow';
import { useUsersStore } from '@/features/users/store';

import s from '@/features/users/components/UsersPanel/UsersPanel.module.css';

export const UsersPanel = () => {
  const status = useChatStore((s) => s.status);
  const users = useUsersStore((s) => s.users);
  const isBuddy = useBuddiesStore((s) => s.isBuddy);
  const ownUserId = identityService.getUserId();

  if (status !== 'active' && status !== 'syncing') {
    return <OfflineNotice />;
  }

  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ul className={s.list}>
      {sorted.map((user) => {
        const isSelf = user.userId === ownUserId;
        return (
          <UserRow
            key={user.userId}
            user={user}
            online
            isBuddy={isBuddy(user.userId)}
            actions={
              isSelf ? null : (
                <>
                  <UserInfoAction nick={user.name} />
                  {isBuddy(user.userId) ? (
                    <RemoveBuddyAction nick={user.name} />
                  ) : (
                    <AddBuddyAction nick={user.name} />
                  )}
                </>
              )
            }
          />
        );
      })}
    </ul>
  );
};
