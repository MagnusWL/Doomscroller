'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_COUNT = 8;
const BATCH_SIZE = 5;

// Alternate video and the banner pair, so neither ad format carries the
// whole feed on its own.
const makeSlide = id => ({ id, type: id % 2 === 1 ? 'video' : 'banner' });

function makeBatch(startId, count) {
  return Array.from({ length: count }, (_, i) => makeSlide(startId + i + 1));
}

// Owns the slide list and appends another batch once a sentinel element at
// the bottom of the feed scrolls into view — the endless-scroll mechanic.
export function useInfiniteSlides(feedRef) {
  const [slides, setSlides] = useState(() => makeBatch(0, INITIAL_COUNT));
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

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
        setSlides(prev => [...prev, ...makeBatch(prev[prev.length - 1].id, BATCH_SIZE)]);
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
