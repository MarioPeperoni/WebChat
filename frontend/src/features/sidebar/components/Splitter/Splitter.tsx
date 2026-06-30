import { useRef, type PointerEvent } from 'react';

import s from '@/features/sidebar/components/Splitter/Splitter.module.css';

interface SplitterProps {
  axis: 'x' | 'y';
  onDrag: (delta: number) => void;
}

export const Splitter = ({ axis, onDrag }: SplitterProps) => {
  const lastRef = useRef(0);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    lastRef.current = axis === 'x' ? event.clientX : event.clientY;

    const handleMove = (ev: PointerEvent<HTMLDivElement>) => {
      const current = axis === 'x' ? ev.clientX : ev.clientY;
      const delta = current - lastRef.current;
      lastRef.current = current;
      if (delta !== 0) onDrag(delta);
    };

    const handleUp = (ev: PointerEvent<HTMLDivElement>) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', handleMove as never);
      target.removeEventListener('pointerup', handleUp as never);
      target.removeEventListener('pointercancel', handleUp as never);
    };

    target.addEventListener('pointermove', handleMove as never);
    target.addEventListener('pointerup', handleUp as never);
    target.addEventListener('pointercancel', handleUp as never);
  };

  return (
    <div
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      className={axis === 'x' ? s.x : s.y}
      onPointerDown={handlePointerDown}
    />
  );
};
