'use client';

import { useCallback, useRef, useState } from 'react';

// The ads the viewer has bought, newest first. Held in memory only: a captured
// frame is a base64 data URL weighing tens of KB, and localStorage's ~5MB would
// be gone in a few dozen buys.
export function useInventory() {
  const nextId = useRef(1);
  const [items, setItems] = useState([]);

  const add = useCallback(ad => {
    setItems(prev => [{ ...ad, id: nextId.current++, boughtAt: Date.now() }, ...prev]);
  }, []);

  return { items, add, count: items.length };
}
