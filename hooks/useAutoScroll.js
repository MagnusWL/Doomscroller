'use client';

import { useEffect } from 'react';

// Advances to the next slide every `intervalMs` while enabled, and stops
// cleanly — no leftover timer — the moment it's toggled off.
export function useAutoScroll(feedRef, enabled, intervalMs = 3000) {
  useEffect(() => {
    if (!enabled) return;
    const feed = feedRef.current;
    if (!feed) return;

    const id = setInterval(() => {
      feed.scrollBy({ top: feed.clientHeight, behavior: 'smooth' });
    }, intervalMs);

    return () => clearInterval(id);
  }, [feedRef, enabled, intervalMs]);
}
