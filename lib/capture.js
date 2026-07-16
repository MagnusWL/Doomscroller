// Grabbing a still of whatever ad is on screen.
//
// A video's frames can be drawn to a canvas, but the canvas taints unless the
// media server sends CORS headers, and toDataURL then throws. Showing a
// cross-origin video is always allowed though — only reading it back is
// blocked. So a failed capture costs a still, not the item: the inventory
// replays the ad instead.

function once(el, event, timeoutMs) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener('error', onErr);
      clearTimeout(timer);
    };
    const onOk = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error(`${event} failed`)); };
    const timer = setTimeout(() => { cleanup(); reject(new Error(`${event} timed out`)); }, timeoutMs);
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener('error', onErr, { once: true });
  });
}

// Draws through a throwaway element rather than the one on screen. Setting
// crossOrigin on a server that doesn't answer with the headers makes the load
// fail outright, and doing that to the playing element would kill the ad to
// take its picture. The byte cost is usually nil — the file is already cached.
export async function captureVideoFrame(video) {
  const src = video.currentSrc || video.src;
  if (!src) return null;

  const probe = document.createElement('video');
  probe.crossOrigin = 'anonymous';
  probe.muted = true;
  probe.playsInline = true;
  probe.preload = 'auto';
  probe.src = src;

  try {
    await once(probe, 'loadeddata', 5000);
    probe.currentTime = video.currentTime || 0;
    await once(probe, 'seeked', 5000);

    const canvas = document.createElement('canvas');
    canvas.width = probe.videoWidth;
    canvas.height = probe.videoHeight;
    if (!canvas.width || !canvas.height) return null;
    canvas.getContext('2d').drawImage(probe, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7); // throws when tainted
  } catch {
    return null; // no CORS headers, or the seek/decode didn't land
  } finally {
    probe.removeAttribute('src');
    probe.load(); // drop the buffer instead of leaving it to the GC
  }
}

// Scroll-snap means the feed is always parked on a slide boundary, so position
// alone identifies what the viewer is looking at.
export function activeSlideElement(feed) {
  if (!feed || !feed.clientHeight) return null;
  const index = Math.round(feed.scrollTop / feed.clientHeight);
  return feed.querySelectorAll('.slide')[index] || null;
}

// Returns null when the slide's ad hasn't filled yet, so there's no video to
// photograph.
export async function captureActiveAd(feed) {
  const slide = activeSlideElement(feed);
  const video = slide && slide.querySelector('video');
  if (!video) return null;

  const mediaUrl = video.currentSrc || video.src || null;
  if (!mediaUrl) return null;

  return { poster: await captureVideoFrame(video), mediaUrl };
}
