'use client';

import { useEffect, useRef } from 'react';
import { CoinSack } from '@/lib/coin-sack-engine';

// Straight from the handoff's approved widget. The engine derives the sack art
// and the coin radius from the canvas box, so the size lives in CSS and nothing
// here needs to know about it.
const SACK = {
  style: 'artsack',
  art: {
    bg: '/sack/sack-bg.png',
    bgB: '/sack/sack-bg-b.png',
    ringBack: '/sack/ring-back.png',
    fg: '/sack/sack-fg.png',
    ringFront: '/sack/ring-front.png',
  },
  fillCount: 14,
  tempo: 0.85,
  glintStyle: 'star',
  soundStyle: 'classic',
  soundOn: true,
  restitution: 0.42,
  friction: 0.58,
  gravity: 1.5,
  bodyScale: 0.72,
  spin: 0.5,
  density: 0.006,
};

export default function AdCoinCounter({ coins }) {
  const canvasRef = useRef(null);
  const sackRef = useRef(null);
  // How many coins the sack has been told about, which lags `coins` while
  // Matter is still loading.
  const droppedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let sack = null;

    // Matter arrives via next/script, so it can still be loading when this
    // mounts — the same race aclib has, handled the same way.
    const start = attempt => {
      if (cancelled) return;
      if (window.Matter) {
        sack = new CoinSack(canvas, SACK);
        sackRef.current = sack;
        // Coins earned during the wait still belong in the sack.
        for (let i = 0; i < droppedRef.current; i++) sack.addCoin();
      } else if (attempt < 40) {
        setTimeout(() => start(attempt + 1), 150);
      }
    };
    start(0);

    return () => {
      cancelled = true;
      if (sack) sack.destroy();
      sackRef.current = null;
    };
  }, []);

  // Web Audio won't start until the page has been interacted with, and the
  // engine only tries once — at construction, which is before any interaction
  // could have happened. So it stays suspended and the coins stay silent until
  // something else on the page happens to unblock audio, which in practice
  // meant unmuting the ad: two unrelated things, tangled. Any interaction
  // resumes it now, and the listeners stay on because the sack may not exist
  // yet the first time one fires.
  useEffect(() => {
    const wake = () => {
      const sack = sackRef.current;
      if (sack && sack.audio && sack.audio.state === 'suspended') sack.audio.resume();
    };
    const events = ['pointerdown', 'touchend', 'keydown'];
    for (const e of events) window.addEventListener(e, wake, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, wake);
    };
  }, []);

  // One coin dropped per coin earned. Counting the difference rather than
  // reacting to each award keeps the sack right even if several land at once.
  useEffect(() => {
    const owed = coins - droppedRef.current;
    droppedRef.current = coins;
    const sack = sackRef.current;
    if (!sack || owed <= 0) return;
    for (let i = 0; i < owed; i++) sack.addCoin();
  }, [coins]);

  return (
    <div className="coin-sack">
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="coin-value">{coins.toLocaleString('da-DK')}</span>
    </div>
  );
}
