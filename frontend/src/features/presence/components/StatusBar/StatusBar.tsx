import { NetLinkIndicator } from '@/features/presence/components/NetLinkIndicator';
import { RoomIndicator } from '@/features/room/components';
import { useRoomsListStore } from '@/features/room/store';

import s from '@/features/presence/components/StatusBar/StatusBar.module.css';

export const StatusBar = () => {
  const count = useRoomsListStore((s) =>
    s.rooms.reduce((sum, room) => sum + room.memberCount, 0),
  );

  return (
    <div className={s.bar}>
      <span className={s.cell}>
        <NetLinkIndicator />
      </span>
      <span className={s.cell}>
        <RoomIndicator />
      </span>
      <span className={s.cell}>
        <span className={s.onlineNumber}>{count}</span>users on-line
      </span>
    </div>
  );
};
