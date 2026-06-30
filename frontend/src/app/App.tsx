import { Header } from '@/app/Header';
import { useAppBoot } from '@/app/useAppBoot';
import { MessageInput, MessageList } from '@/features/chat';
import { StatusBar } from '@/features/presence';
import { Sidebar, Splitter, useSidebarStore } from '@/features/sidebar';
import { Window } from '@/shared';

import s from '@/app/App.module.css';

export const App = () => {
  useAppBoot();
  const resizeWidth = useSidebarStore((s) => s.resizeWidth);

  return (
    <>
      <Header />
      <Window className={s.chatWindow}>
        <Window.TitleBar>WebChat</Window.TitleBar>
        <Window.Body>
          <div className={s.row}>
            <MessageList />
            <Splitter axis="x" onDrag={(delta) => resizeWidth(-delta)} />
            <Sidebar />
          </div>
          <MessageInput />
        </Window.Body>
        <Window.StatusBar>
          <StatusBar />
        </Window.StatusBar>
      </Window>
    </>
  );
};
