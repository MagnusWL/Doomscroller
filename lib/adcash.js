// Adcash integrations: the banner slots inside slides, and the page-level
// video slider that rides alongside the feed.

export const AC_ZONE_ID = '11731342';
export const AC_VIDEO_SLIDER_ZONE = '11730578';

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

// Adcash places the slider itself — there is no renderIn pointing at a slide —
// so it adds inventory rather than competing for room in the feed. It belongs
// to the page, not to any one slide: guard against a second run, since React
// invokes effects twice in development.
let sliderStarted = false;

export function runVideoSlider() {
  if (sliderStarted) return;
  sliderStarted = true;
  attemptVideoSlider(0);
}

function attemptVideoSlider(attempt) {
  const aclib = typeof window !== 'undefined' ? window.aclib : undefined;
  if (aclib && typeof aclib.runVideoSlider === 'function') {
    aclib.runVideoSlider({ zoneId: AC_VIDEO_SLIDER_ZONE });
  } else if (attempt < 20) {
    setTimeout(() => attemptVideoSlider(attempt + 1), 300);
  }
}
