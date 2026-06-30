import { UserPlus } from 'pixelarticons/react/UserPlus';

import { buddyService } from '@/features/buddies/services';

import s from '@/features/buddies/components/actions/actions.module.css';

interface AddBuddyActionProps {
  nick: string;
}

export const AddBuddyAction = ({ nick }: AddBuddyActionProps) => (
  <button
    type="button"
    className={`${s.button} ${s.add}`}
    title="add to buddies"
    onClick={() => buddyService.add(nick)}
  >
    <UserPlus width={14} height={14} />
  </button>
);
