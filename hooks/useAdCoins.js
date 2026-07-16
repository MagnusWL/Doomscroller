'use client';

import { useCallback, useState } from 'react';

// One coin per slide reached. Driven by useSlideProgress, which only counts
// forward, so bouncing between two slides doesn't mint coins.
export function useAdCoins() {
  const [coins, setCoins] = useState(0);
  const award = useCallback(() => setCoins(c => c + 1), []);
  return { coins, award };
}
