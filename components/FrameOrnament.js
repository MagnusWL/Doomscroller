'use client';

import { useEffect, useRef } from 'react';
import { drawOrnate, isOrnate } from '@/lib/frames';

// The gold frames are drawn rather than styled, so they need to know where the
// ad window actually is. The bars are fixed and the side margin is a variable,
// which pins the window without reading any slide — so this doesn't move when
// the feed scrolls, and doesn't care which slide is up.
function windowRect() {
  const bar = document.querySelector('.action-bar');
  const bottom = document.querySelector('.bottom-bar');
  if (!bar || !bottom) return null;

  const css = getComputedStyle(document.documentElement);
  const fx = parseFloat(css.getPropertyValue('--frame-x'));
  const fy = parseFloat(css.getPropertyValue('--frame-y'));
  if (!isFinite(fx) || !isFinite(fy)) return null;

  const top = bar.getBoundingClientRect().bottom + fy;
  const foot = bottom.getBoundingClientRect().top - fy;
  return { x: fx, y: top, w: window.innerWidth - fx * 2, h: foot - top };
}

export default function FrameOrnament({ frame }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOrnate(frame)) return;

    const paint = () => {
      const rect = windowRect();
      if (rect && rect.w > 0 && rect.h > 0) drawOrnate(canvas, rect, frame === '13a');
    };
    paint();

    const observer = new ResizeObserver(paint);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [frame]);

  if (!isOrnate(frame)) return null;
  return <canvas ref={canvasRef} className="frame-ornament" aria-hidden="true" />;
}
