import { useEffect, type RefObject } from 'react';

export const useAutoScroll = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: unknown[],
) => {
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
