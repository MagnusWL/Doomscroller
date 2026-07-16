// Finding the picture inside the file.
//
// Advertisers deliver a spot on whatever canvas they had lying around. One
// HilltopAds creative declares 1280x720 and spends 633 of those pixels on black
// padding beside a 647x720 picture. Fit that by the file's shape and the ad
// shrinks twice — once into our letterbox, then again inside its own padding —
// which is how a vertical ad ends up a stamp in the middle of the slide.
//
// So the picture's bounds come from the pixels. Reading them needs CORS on the
// media host; without it the canvas taints and this returns null, and the
// caller falls back to trusting the file.

const DARK = 18; // mean luminance, 0-255
const STEP = 10; // pixels to skip when averaging an edge line

function edgeScanner(data, w, h) {
  const lum = (x, y) => {
    const i = (y * w + x) * 4;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  };
  const colDark = x => {
    let sum = 0, n = 0;
    for (let y = 0; y < h; y += STEP) { sum += lum(x, y); n++; }
    return sum / n < DARK;
  };
  const rowDark = y => {
    let sum = 0, n = 0;
    for (let x = 0; x < w; x += STEP) { sum += lum(x, y); n++; }
    return sum / n < DARK;
  };
  let left = 0; while (left < w / 2 && colDark(left)) left++;
  let right = 0; while (right < w / 2 && colDark(w - 1 - right)) right++;
  let top = 0; while (top < h / 2 && rowDark(top)) top++;
  let bottom = 0; while (bottom < h / 2 && rowDark(h - 1 - bottom)) bottom++;
  return { left, right, top, bottom };
}

function once(el, event, timeoutMs) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener('error', onErr);
      clearTimeout(timer);
    };
    const onOk = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error('media error')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('timed out')); }, timeoutMs);
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener('error', onErr, { once: true });
  });
}

// Several frames, because one dark scene is not a black bar. Padding is black
// in every frame, so the narrowest bar any frame shows is the real one.
const SAMPLE_AT = [0.15, 0.45, 0.75];

export async function pictureBounds(src) {
  if (!src) return null;

  // A throwaway element: setting crossOrigin on a host that doesn't answer with
  // the headers makes the load fail outright, and doing that to the element on
  // screen would kill the ad to measure it. The file is already cached, so the
  // byte cost is usually nil.
  const probe = document.createElement('video');
  probe.crossOrigin = 'anonymous';
  probe.muted = true;
  probe.playsInline = true;
  probe.preload = 'auto';
  probe.src = src;

  try {
    await once(probe, 'loadeddata', 8000);
    const w = probe.videoWidth, h = probe.videoHeight;
    if (!w || !h) return null;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let bars = null;
    for (const at of SAMPLE_AT) {
      probe.currentTime = (probe.duration || 1) * at;
      await once(probe, 'seeked', 5000);
      ctx.drawImage(probe, 0, 0);
      const found = edgeScanner(ctx.getImageData(0, 0, w, h).data, w, h); // throws when tainted
      bars = bars
        ? {
            left: Math.min(bars.left, found.left),
            right: Math.min(bars.right, found.right),
            top: Math.min(bars.top, found.top),
            bottom: Math.min(bars.bottom, found.bottom),
          }
        : found;
      if (!bars.left && !bars.right && !bars.top && !bars.bottom) break; // nothing to find
    }

    const rect = {
      x: bars.left,
      y: bars.top,
      w: w - bars.left - bars.right,
      h: h - bars.top - bars.bottom,
    };
    return rect.w > 0 && rect.h > 0 ? { file: { w, h }, picture: rect } : null;
  } catch {
    return null; // no CORS on the media host, or the decode didn't land
  } finally {
    probe.removeAttribute('src');
    probe.load(); // drop the buffer rather than leave it to the GC
  }
}

// Lay the file out so its picture — not its padding — lands in the box, then
// let the box's overflow clip the padding away.
export function placePicture({ file, picture, box, mode, zoom = 1 }) {
  const scale = (mode === 'cover'
    ? Math.max(box.w / picture.w, box.h / picture.h)
    : Math.min(box.w / picture.w, box.h / picture.h)) * zoom;
  return {
    width: file.w * scale,
    height: file.h * scale,
    left: box.w / 2 - (picture.x + picture.w / 2) * scale,
    top: box.h / 2 - (picture.y + picture.h / 2) * scale,
  };
}
