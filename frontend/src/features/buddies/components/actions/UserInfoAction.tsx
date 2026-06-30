import { InfoBox } from 'pixelarticons/react/InfoBox';

import { commandService } from '@/features/commands';

import s from '@/features/buddies/components/actions/actions.module.css';

interface UserInfoActionProps {
  nick: string;
}

export const UserInfoAction = ({ nick }: UserInfoActionProps) => (
  <button
    type="button"
    className={`${s.button} ${s.info}`}
    title="info"
    onClick={() => commandService.send(`/profile view ${nick}`)}
  >
    <InfoBox width={14} height={14} />
  </button>
);
