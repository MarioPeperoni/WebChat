import { UserMinus } from 'pixelarticons/react/UserMinus';

import { buddyService } from '@/features/buddies/services';

import s from '@/features/buddies/components/actions/actions.module.css';

interface RemoveBuddyActionProps {
  nick: string;
}

export const RemoveBuddyAction = ({ nick }: RemoveBuddyActionProps) => (
  <button
    type="button"
    className={`${s.button} ${s.remove}`}
    title="remove from buddies"
    onClick={() => buddyService.remove(nick)}
  >
    <UserMinus width={14} height={14} />
  </button>
);
