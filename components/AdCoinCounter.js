'use client';

import { useEffect, useRef } from 'react';
import { CoinSack } from '@/lib/coin-sack-engine';
import { sackArt, COIN_TONES } from '@/lib/frames';

// Fourteen real coin clips. One at random lands on top of the synth clink every
// time a coin is earned — only which clip is random, never whether.
const COIN_SAMPLES = Array.from({ length: 14 }, (_, i) => `/sack/coin/coin-${i + 1}.wav`);

// The handoff's approved widget. The engine derives the sack art and the coin
// radius from the canvas box, so the size lives in CSS and nothing here needs to
// know about it — but the theme does, because the sack is tinted to match the
// frame around it.
function sackOpts(frame) {
  return {
    style: 'artsack',
    art: sackArt(frame),
    // Tinted sacks, untinted coins: one gold in every theme, per the handoff.
    coinTones: COIN_TONES,
    // The whole sack renders into a 1/2.4 buffer and the browser upscales it
    // nearest-neighbour, so the art reads as chunky as the coins do. It takes
    // the place of devicePixelRatio, so this is deliberately low-res.
    pixelate: true,
    pixelSize: 2.4,
    coinSamples: COIN_SAMPLES,
    flipSample: '/sack/coin-flip.mp3',
    spendStyle: 1,
    fillCount: 16,
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
}

export default function AdCoinCounter({ coins, frame }) {
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
        sack = new CoinSack(canvas, sackOpts(frame));
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
    // Rebuilt when the theme changes: the engine reads its art once, at birth.
    // In practice the frame is picked at the gate and never moves, so this runs
    // the once — but the sack would be the wrong colour if it ever did.
  }, [frame]);

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
      if (!sack) return;
      // Build it here if it doesn't exist yet: made inside a gesture it starts
      // running, whereas the engine makes it on the first coin, which is before
      // anything has been touched. Then resume regardless of what it claims its
      // state is — the call is free and the state isn't always honest.
      sack._ensureAudio();
      if (sack.audio && sack.audio.state !== 'running') sack.audio.resume();
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
