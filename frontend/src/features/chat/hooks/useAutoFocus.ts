import { useEffect, type RefObject } from 'react';

export const useAutoFocus = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: unknown[],
) => {
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
