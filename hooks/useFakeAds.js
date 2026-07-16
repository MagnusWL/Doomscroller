'use client';

import { useCallback, useEffect, useState } from 'react';

// Roughly one slide in five is a fake ad. Scattered rather than on a fixed beat,
// so the feed doesn't develop a rhythm you can feel coming.
const FAKE_ODDS = 5;

// Deterministic scatter: the same id and salt always give the same answer, which
// is what lets the server and the browser agree on the feed. Math.random() during
// render would have them disagree and break hydration.
function hash(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^= h >>> 16) >>> 0;
}

// Which slides carry a fake ad instead of a real one. Kept out of
// useInfiniteSlides so a slide stays a plain id there: this is a question you
// ask about a slide, not a property the feed has to carry around.
export function useFakeAds() {
  // 0 means "not decided yet", so nothing is fake through the server render and
  // the first client render. The salt lands on mount.
  const [salt, setSalt] = useState(0);

  useEffect(() => {
    // One per page load, so the fake ads land somewhere new each visit rather
    // than always on the same slides.
    setSalt(Math.floor(Math.random() * 1e9) + 1);
  }, []);

  // Slide 1 is exempt: it's on screen before the salt arrives, and swapping it
  // under the reader would be a visible flinch on load.
  return useCallback(
    id => salt !== 0 && id > 1 && hash(id * 31 + salt) % FAKE_ODDS === 0,
    [salt]
  );
}
