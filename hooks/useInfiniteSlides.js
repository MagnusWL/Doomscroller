'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_COUNT = 8;
const BATCH_SIZE = 5;

// Two video slides for every banner pair: video is the format worth scrolling,
// banners keep the mix from resting on one demand source. Where the banner zone
// won't serve at all, video takes the slide instead of leaving it empty.
const makeSlide = (id, videoOnly) => ({
  id,
  type: !videoOnly && id % 3 === 0 ? 'banner' : 'video',
});

function makeBatch(startId, count, videoOnly) {
  return Array.from({ length: count }, (_, i) => makeSlide(startId + i + 1, videoOnly));
}

// Adcash's banner zone comes back empty on desktop while the video zones fill
// there, so handing a desktop a banner slide is handing it a blank screen.
// Which signal Adcash actually reads is unconfirmed, but a coarse pointer is
// the closest thing the browser offers to the device its server infers from the
// User-Agent — closer than viewport width, which a narrow desktop window would
// get wrong in exactly the case we're trying to fix.
const prefersVideoOnly = () =>
  typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches;

// Owns the slide list and appends another batch once a sentinel element at
// the bottom of the feed scrolls into view — the endless-scroll mechanic.
export function useInfiniteSlides(feedRef) {
  // Starts false so the server render and the first client render agree; the
  // effect below corrects it on mount, before any slide past the first is on
  // screen to notice.
  const [videoOnly, setVideoOnly] = useState(false);
  const videoOnlyRef = useRef(false);

  const [slides, setSlides] = useState(() => makeBatch(0, INITIAL_COUNT, false));
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const apply = () => setVideoOnly(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Rebuild the banner slides already on the list once the device is known.
  // Keyed on videoOnly rather than slides, so a slide that later falls back to
  // a banner for want of video fill isn't flipped straight back.
  useEffect(() => {
    videoOnlyRef.current = videoOnly;
    if (!videoOnly) return;
    setSlides(prev => prev.map(s => (s.type === 'banner' ? { ...s, type: 'video' } : s)));
  }, [videoOnly]);

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
          ...makeBatch(prev[prev.length - 1].id, BATCH_SIZE, videoOnlyRef.current),
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
