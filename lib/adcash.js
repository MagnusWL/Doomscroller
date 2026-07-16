// Adcash banner integration. Owns the one thing every banner slot needs:
// asking aclib to fill a container by selector.

export const AC_ZONE_ID = '11731342';

// aclib.js loads via next/script's "afterInteractive" strategy, so it can
// still be mid-load — or defined but not yet fully initialized — when the
// first slides mount on page load. Retry briefly instead of dropping the ad
// silently or throwing on a half-loaded library.
export function runBanners(slotIds, attempt = 0) {
  if (!slotIds.length) return;
  const aclib = typeof window !== 'undefined' ? window.aclib : undefined;
  if (aclib && typeof aclib.runBanner === 'function') {
    for (const id of slotIds) {
      aclib.runBanner({ zoneId: AC_ZONE_ID, renderIn: `#${id}` });
    }
  } else if (attempt < 20) {
    setTimeout(() => runBanners(slotIds, attempt + 1), 300);
  }
}
