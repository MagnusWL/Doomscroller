'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_COUNT = 8;
const BATCH_SIZE = 5;

// Roughly one slide in five is a fake ad. Scattered rather than on a fixed beat,
// so the feed doesn't develop a rhythm you can feel coming.
const FAKE_ODDS = 5;

// Deterministic scatter: same id and salt always give the same answer, which is
// what lets the server and the browser agree on the feed. Math.random() during
// render would have them disagree and break hydration.
function hash(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^= h >>> 16) >>> 0;
}

// Slide 1 is exempt: it's on screen before the salt arrives, and swapping it
// under the reader would be a visible flinch on load.
const isFake = (id, salt) => salt !== 0 && id > 1 && hash(id * 31 + salt) % FAKE_ODDS === 0;

// Two video slides for every banner pair: video is the format worth scrolling,
// banners keep the mix from resting on one demand source. Where the banner zone
// won't serve at all, video takes the slide instead of leaving it empty.
function makeSlide(id, { videoOnly, salt }) {
  if (isFake(id, salt)) return { id, type: 'fake' };
  return { id, type: !videoOnly && id % 3 === 0 ? 'banner' : 'video' };
}

function makeBatch(startId, count, mix) {
  return Array.from({ length: count }, (_, i) => makeSlide(startId + i + 1, mix));
}

// Adcash's banner zone comes back empty on desktop while the video zones fill
// there, so handing a desktop a banner slide is handing it a blank screen.
// Which signal Adcash actually reads is unconfirmed, but a coarse pointer is
// the closest thing the browser offers to the device its server infers from the
// User-Agent — closer than viewport width, which a narrow desktop window would
// get wrong in exactly the case we're trying to fix.
const prefersVideoOnly = () => !window.matchMedia('(pointer: coarse)').matches;

// Owns the slide list and appends another batch once a sentinel element at
// the bottom of the feed scrolls into view — the endless-scroll mechanic.
export function useInfiniteSlides(feedRef) {
  // Both start neutral so the server render and the first client render agree;
  // the effect below settles them on mount. salt 0 means "not yet decided", so
  // no slide is fake until the browser has picked a number.
  const [mix, setMix] = useState({ videoOnly: false, salt: 0 });
  const mixRef = useRef(mix);

  const [slides, setSlides] = useState(() => makeBatch(0, INITIAL_COUNT, { videoOnly: false, salt: 0 }));
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const apply = () => setMix(prev => ({
      videoOnly: prefersVideoOnly(),
      // One salt per page load, so the fake ads land somewhere new each visit
      // rather than always on the same slides.
      salt: prev.salt || Math.floor(Math.random() * 1e9) + 1,
    }));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Rebuild the list once the device and the salt are known. Keyed on mix rather
  // than slides, so a slide that later falls back to a banner for want of video
  // fill isn't flipped straight back.
  useEffect(() => {
    mixRef.current = mix;
    if (!mix.salt) return;
    setSlides(prev => prev.map(s => makeSlide(s.id, mix)));
  }, [mix]);

  useEffect(() => {
    loadingRef.current = false; // a batch just committed; allow the next trigger
  }, [slides]);

  useEffect(() => {
    const feed = feedRef.current;
    const sentinel = sentinelRef.current;
    if (!feed || !sentinel) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingRef.current) {
        loadingRef.current = true;
        setSlides(prev => [
          ...prev,
          ...makeBatch(prev[prev.length - 1].id, BATCH_SIZE, mixRef.current),
        ]);
      }
    }, { root: feed, rootMargin: '400px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feedRef]);

  // A video slide that comes back with no fill converts itself to a banner
  // pair instead of leaving a dead black slide, so the slot still earns.
  const markSlideAsBanner = useCallback(id => {
    setSlides(prev => prev.map(s => (s.id === id ? { ...s, type: 'banner' } : s)));
  }, []);

  return { slides, sentinelRef, markSlideAsBanner };
}
