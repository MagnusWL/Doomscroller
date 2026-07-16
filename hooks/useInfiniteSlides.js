'use client';

import { useEffect, useRef, useState } from 'react';

const INITIAL_COUNT = 8;
const BATCH_SIZE = 5;

// Slides are just ids now — every one is a video ad, so there's nothing else
// to say about them.
const makeBatch = (startId, count) =>
  Array.from({ length: count }, (_, i) => startId + i + 1);

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
        setSlides(prev => [...prev, ...makeBatch(prev[prev.length - 1], BATCH_SIZE)]);
      }
    }, { root: feed, rootMargin: '400px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feedRef]);

  return { slides, sentinelRef };
}
