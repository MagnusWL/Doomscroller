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

  // React attaches refs before it runs effects, so the first batch of slides
  // registers while there is still no observer to hand them to. They wait here
  // until there is. Dropping them instead cost a coin per slide until the feed
  // appended its second batch.
  const waiting = useRef(new Set());

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
    for (const el of waiting.current) observer.observe(el);
    waiting.current.clear();

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [feedRef]);

  return useCallback(el => {
    if (!el) return;
    if (observerRef.current) observerRef.current.observe(el);
    else waiting.current.add(el);
  }, []);
}
