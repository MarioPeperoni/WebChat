import { Home } from 'pixelarticons/react/Home';

import { useRoomStore } from '@/features/room/store';

import s from '@/features/room/components/RoomIndicator/RoomIndicator.module.css';

export const RoomIndicator = () => {
  const room = useRoomStore((s) => s.room);

  return (
    <>
      <span className={s.icon}>
        <Home width={14} height={14} />
      </span>
      {room ? room.name : '—'}
    </>
  );
};
