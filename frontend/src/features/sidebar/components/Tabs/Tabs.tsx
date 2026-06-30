import type { ReactNode } from 'react';

import s from '@/features/sidebar/components/Tabs/Tabs.module.css';

interface Tab<T extends string> {
  id: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  activeId: T;
  onSelect: (id: T) => void;
}

export const Tabs = <T extends string>({
  tabs,
  activeId,
  onSelect,
}: TabsProps<T>) => (
  <div className={s.bar} role="tablist">
    {tabs.map((tab) => {
      const isActive = tab.id === activeId;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`${s.tab} ${isActive ? s.tabActive : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span className={s.label}>{tab.label}</span>
        </button>
      );
    })}
    <div className={s.spacer} />
  </div>
);
