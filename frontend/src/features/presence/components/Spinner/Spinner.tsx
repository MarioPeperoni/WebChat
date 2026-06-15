import s from '@/features/presence/components/Spinner/Spinner.module.css';

export const Spinner = () => (
  <span className={s.spinner} aria-hidden="true">
    <span />
    <span />
    <span />
    <span />
    <span />
    <span />
    <span />
    <span />
  </span>
);
