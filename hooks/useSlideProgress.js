'use client';

import { useCallback, useEffect, useRef } from 'react';

// Fires onAdvance(index) once per newly-reached slide, forward only —
// scrolling back to an earlier slide never re-fires it. Returns a ref
// callback: pass it to each slide's wrapping element and it self-registers
// with the one shared observer as it mounts.
export function useSlideProgress(feedRef, onAdvance) {
  const lastSeenIndex = useRef(1); // slide 1 is the initial view, not a swipe
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;
  const observerRef = useRef(null);

  // React attaches every ref in the initial render's tree — all 8 starting
  // slides — before this effect ever runs, so their ref callbacks fire while
  // observerRef.current is still null. Track them here and observe them once
  // the observer exists, or the entire opening batch silently never earns a
  // coin and only slides appended later (once useInfiniteSlides' batches
  // start arriving after the effect has run) do.
  const pendingRef = useRef(new Set());

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const idx = Number(entry.target.dataset.index);
        if (idx > lastSeenIndex.current) {
          lastSeenIndex.current = idx;
          onAdvanceRef.current(idx);
        }
      }
    }, { root: feed, threshold: 0.6 });

    observerRef.current = observer;
    pendingRef.current.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [feedRef]);

  return useCallback(el => {
    if (!el) return;
    pendingRef.current.add(el);
    if (observerRef.current) observerRef.current.observe(el);
  }, []);
}
