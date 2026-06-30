import { useChatStore } from '@/features/chat';
import { RoomRow } from '@/features/room/components/RoomRow';
import { useRoomStore, useRoomsListStore } from '@/features/room/store';
import { OfflineNotice } from '@/features/sidebar/components/OfflineNotice';

import s from '@/features/room/components/RoomsPanel/RoomsPanel.module.css';

export const RoomsPanel = () => {
  const status = useChatStore((s) => s.status);
  const rooms = useRoomsListStore((s) => s.rooms);
  const currentRoomId = useRoomStore((s) => s.room?.roomId);

  if (status !== 'active' && status !== 'syncing') {
    return <OfflineNotice />;
  }

  if (rooms.length === 0) {
    return <div className={s.empty}>No rooms.</div>;
  }

  return (
    <ul className={s.list}>
      {rooms.map((room) => (
        <RoomRow
          key={room.roomId}
          room={room}
          isCurrent={room.roomId === currentRoomId}
        />
      ))}
    </ul>
  );
};
