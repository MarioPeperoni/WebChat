import { NetLinkIndicator } from '@/features/presence/components/NetLinkIndicator';
import { usePresenceStore } from '@/features/presence/store';

import s from '@/features/presence/components/StatusBar/StatusBar.module.css';

export const StatusBar = () => {
  const count = usePresenceStore((s) => s.count);

  return (
    <div className={s.bar}>
      <span className={s.cell}>
        <NetLinkIndicator />
      </span>
      <span className={s.cell}>
        <span className={s.onlineNumber}>{count}</span>users on-line
      </span>
    </div>
  );
};
