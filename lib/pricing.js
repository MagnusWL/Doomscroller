// What each ad costs in ad coins.

export const MIN_PRICE = 2;
export const MAX_PRICE = 8;

// Derived from the slide id rather than drawn fresh. The server and the client
// both render this number, and Math.random() would hand them different answers
// — a hydration mismatch, and a price that changes as you look at it. Uses
// fmix32, an avalanche hash, to scatter consecutive ids so the sequence doesn't
// repeat predictably across the feed.
export function priceFor(id) {
  // fmix32: a 32-bit finalization mixer that avalanches hash bit patterns
  let h = id;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  const spread = MAX_PRICE - MIN_PRICE + 1;
  return MIN_PRICE + ((h >>> 0) % spread);
}
