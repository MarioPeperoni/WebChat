import s from '@/app/Header/Header.module.css';

export const Header = () => (
  <header className={s.header}>
    <h1 className={s.title}>Net-Chat</h1>
    <h2 className={s.tagline}>On-line real-time text on the Web</h2>
  </header>
);
