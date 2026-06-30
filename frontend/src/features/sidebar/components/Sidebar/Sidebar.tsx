import { BuddiesPanel } from '@/features/buddies';
import { useBuddiesStore } from '@/features/buddies/store';
import { RoomsPanel } from '@/features/room/components';
import { Splitter } from '@/features/sidebar/components/Splitter';
import { Tabs } from '@/features/sidebar/components/Tabs';
import { useSidebarStore } from '@/features/sidebar/store';
import { UsersPanel } from '@/features/users';
import { useUsersStore } from '@/features/users/store';

import s from '@/features/sidebar/components/Sidebar/Sidebar.module.css';

const badge = (count: number, faceClass: string) => (
  <span className={`${s.tabBadge} ${count > 0 ? faceClass : s.tabBadgeEmpty}`}>
    {count}
  </span>
);

export const Sidebar = () => {
  const activeTab = useSidebarStore((s) => s.activeTab);
  const setActiveTab = useSidebarStore((s) => s.setActiveTab);
  const width = useSidebarStore((s) => s.width);
  const roomsHeight = useSidebarStore((s) => s.roomsHeight);
  const resizeRoomsHeight = useSidebarStore((s) => s.resizeRoomsHeight);
  const buddiesOnline = useBuddiesStore(
    (st) => st.buddies.filter((b) => b.online).length,
  );
  const usersCount = useUsersStore((st) => st.users.length);

  const tabs = [
    {
      id: 'users' as const,
      label: (
        <>
          Users
          {badge(usersCount, s.tabBadgeOnline)}
        </>
      ),
    },
    {
      id: 'buddies' as const,
      label: (
        <>
          Buddies
          {badge(buddiesOnline, s.tabBadgeOnline)}
        </>
      ),
    },
  ];

  return (
    <aside className={s.sidebar} style={{ width }}>
      <div className={s.peoplePanel}>
        <Tabs tabs={tabs} activeId={activeTab} onSelect={setActiveTab} />
        <div className={s.tabBody}>
          {activeTab === 'users' ? <UsersPanel /> : <BuddiesPanel />}
        </div>
      </div>
      <Splitter axis="y" onDrag={(delta) => resizeRoomsHeight(-delta)} />
      <div className={s.roomsSection} style={{ height: roomsHeight }}>
        <div className={s.sectionHeader}>Rooms</div>
        <RoomsPanel />
      </div>
    </aside>
  );
};
