import { Clock } from 'pixelarticons/react/Clock';

import { useChatStore } from '@/features/chat';
import { Spinner } from '@/features/presence/components/Spinner';

import s from '@/features/presence/components/NetLinkIndicator/NetLinkIndicator.module.css';

export const NetLinkIndicator = () => {
  const status = useChatStore((s) => s.status);

  if (status === 'idle') {
    return (
      <>
        <span className={`${s.icon} ${s.iconIdle}`}>
          <Clock width={14} height={14} />
        </span>{' '}
        Net Link: Idle
      </>
    );
  }

  if (status === 'establishing' || status === 'syncing') {
    return (
      <>
        <Spinner />
        Net Link: {status === 'establishing' ? 'Establishing' : 'Syncing'}
        <span className={s.dots} aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <span className={`${s.icon} ${s.iconActive}`}>✓</span> Net Link: Active
    </>
  );
};
