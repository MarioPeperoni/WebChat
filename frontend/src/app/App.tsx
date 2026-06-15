import { Header } from '@/app/Header';
import { useAppBoot } from '@/app/useAppBoot';
import { MessageInput, MessageList } from '@/features/chat';
import { StatusBar } from '@/features/presence';
import { Window } from '@/shared';

import s from '@/app/App.module.css';

export const App = () => {
  useAppBoot();

  return (
    <>
      <Header />
      <Window className={s.chatWindow}>
        <Window.TitleBar>WebChat</Window.TitleBar>
        <Window.Body>
          <MessageList />
          <MessageInput />
        </Window.Body>
        <Window.StatusBar>
          <StatusBar />
        </Window.StatusBar>
      </Window>
    </>
  );
};
