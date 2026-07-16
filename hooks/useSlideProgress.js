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

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    observerRef.current = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const idx = Number(entry.target.dataset.index);
        if (idx > lastSeenIndex.current) {
          lastSeenIndex.current = idx;
          onAdvanceRef.current(idx);
        }
      }
    }, { root: feed, threshold: 0.6 });

    return () => observerRef.current.disconnect();
  }, [feedRef]);

  return useCallback(el => {
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);
}
