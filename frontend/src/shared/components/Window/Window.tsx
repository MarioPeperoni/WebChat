import type { ReactNode } from 'react';

import s from '@/shared/components/Window/Window.module.css';

interface WindowProps {
  children: ReactNode;
  className?: string;
}

const Root = ({ children, className }: WindowProps) => (
  <section className={className ? `${s.window} ${className}` : s.window}>
    {children}
  </section>
);

const TitleBar = ({ children }: { children: ReactNode }) => (
  <div className={s.titlebar}>{children}</div>
);

const Body = ({ children }: { children: ReactNode }) => (
  <div className={s.body}>{children}</div>
);

const StatusBar = ({ children }: { children: ReactNode }) => (
  <div className={s.statusbar}>{children}</div>
);

export const Window = Object.assign(Root, {
  TitleBar,
  Body,
  StatusBar,
});
