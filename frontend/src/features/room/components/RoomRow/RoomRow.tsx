import { InfoBox } from 'pixelarticons/react/InfoBox';
import { Lock } from 'pixelarticons/react/Lock';
import { Login } from 'pixelarticons/react/Login';
import type { RoomSummary } from '@webchat/shared';

import { useInputDraftStore } from '@/features/chat/store';
import { commandService } from '@/features/commands';

import s from '@/features/room/components/RoomRow/RoomRow.module.css';

interface RoomRowProps {
  room: RoomSummary;
  isCurrent: boolean;
}

export const RoomRow = ({ room, isCurrent }: RoomRowProps) => {
  const handleJoin = () => {
    if (isCurrent) return;
    if (room.hasPassword) {
      useInputDraftStore.getState().setDraft(`/room join ${room.name} `);
      return;
    }
    commandService.send(`/room join ${room.name}`);
  };

  const handleInfo = () => {
    commandService.send(`/room info ${room.name}`);
  };

  return (
    <li className={`${s.row} ${isCurrent ? s.rowCurrent : ''}`}>
      <span className={s.hash}>#</span>
      <span className={s.name}>{room.name}</span>
      <span className={s.lock}>
        {room.hasPassword && <Lock width={11} height={11} />}
      </span>
      <span className={s.count}>{room.memberCount}</span>
      <span className={s.actions}>
        {!isCurrent && (
          <button
            type="button"
            className={`${s.action} ${s.actionJoin}`}
            title={room.hasPassword ? 'join (needs password)' : 'join'}
            onClick={handleJoin}
          >
            <Login width={14} height={14} />
          </button>
        )}
        <button
          type="button"
          className={`${s.action} ${s.actionInfo}`}
          title="info"
          onClick={handleInfo}
        >
          <InfoBox width={14} height={14} />
        </button>
      </span>
    </li>
  );
};
