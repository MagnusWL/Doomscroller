// Adcash integration: the page-level video slider that rides alongside the
// feed. The in-slide banner zone was dropped when the feed went video-only —
// see git history for runBanners if it ever comes back.

// "Ad in ad": an ad the network drops on top of our own, wherever it likes.
//
// Off. Not because it earns nothing — it's a paid zone sitting idle — but
// because we don't place it. In-stream hands us a VAST tag and our player
// decides everything; the slider has no renderIn, so Adcash injects its own
// element and puts it where it wants. In practice that's the bottom of the
// screen, over the chrome, including the Buy ad button. We built a frame where
// nothing covers the ad, and this covers the frame.
//
// Nothing else needs changing to bring it back — Feed already calls
// runVideoSlider on mount, and this is the only thing stopping it.
export const AD_IN_AD = false;

export const AC_VIDEO_SLIDER_ZONE = '11730578';

// It belongs to the page, not to any one slide: guard against a second run,
// since React invokes effects twice in development.
let sliderStarted = false;

export function runVideoSlider() {
  if (!AD_IN_AD || sliderStarted) return;
  sliderStarted = true;
  attemptVideoSlider(0);
}

// aclib.js loads via next/script's "afterInteractive" strategy, so it can still
// be mid-load — or defined but not yet fully initialized — when the feed
// mounts. Retry briefly instead of dropping the slider silently or throwing on
// a half-loaded library.
function attemptVideoSlider(attempt) {
  const aclib = typeof window !== 'undefined' ? window.aclib : undefined;
  if (aclib && typeof aclib.runVideoSlider === 'function') {
    aclib.runVideoSlider({ zoneId: AC_VIDEO_SLIDER_ZONE });
  } else if (attempt < 20) {
    setTimeout(() => attemptVideoSlider(attempt + 1), 300);
  }
}
