// VAST resolution and parsing. Pure data-in, data-out — no DOM rendering
// here, so this can be unit-tested without a browser video element.

// Video ad sources, rotated until one fills. VAST is an IAB standard, so a new
// network is one more entry here and nothing else.
export const VAST_TAGS = [
  // Adcash In-stream Video zones. Both fill on desktop as well as mobile,
  // unlike the banner zone. Two zones against the same demand still widen the
  // creative rotation and cover each other's frequency caps.
  () => 'https://youradexchange.com/video/select.php?r=11731718',
  () => 'https://youradexchange.com/video/select.php?r=11731598',
  // HilltopAds, replacing the Google sample tag that stood in here while this
  // was being built. Second network, so a bad hour at Adcash no longer empties
  // the feed. Its VAST declares a default xmlns and tracks only impression and
  // start — no quartiles, which the player simply doesn't fire.
  () => 'https://difficultblock.com/dymAFSztd.GgNkvoZAGoUV/Hefmf9BuvZhUfl/khP/TFcmyMM/jmku1fNPTrcmt-NlzXIVyIO/TZU/2FM/QD',
];

const nodeText = el => el && el.textContent.trim();

function collectTrackers(ad) {
  const t = { impression: [], click: [], events: {} };
  ad.querySelectorAll('Impression').forEach(n => t.impression.push(nodeText(n)));
  ad.querySelectorAll('ClickTracking').forEach(n => t.click.push(nodeText(n)));
  ad.querySelectorAll('TrackingEvents > Tracking').forEach(n => {
    const ev = n.getAttribute('event');
    (t.events[ev] = t.events[ev] || []).push(nodeText(n));
  });
  return t;
}

function mergeTrackers(outer, inner) {
  const events = Object.assign({}, outer.events);
  for (const [ev, urls] of Object.entries(inner.events)) {
    events[ev] = (events[ev] || []).concat(urls);
  }
  return {
    impression: outer.impression.concat(inner.impression),
    click: outer.click.concat(inner.click),
    events,
  };
}

// Progressive MP4 only — HLS and DASH need a media-source player we don't ship.
function pickMedia(ad) {
  const files = [...ad.querySelectorAll('MediaFile')]
    .filter(f => (f.getAttribute('type') || '').includes('mp4'))
    .map(f => ({ url: nodeText(f), width: +f.getAttribute('width') || 0 }))
    .filter(f => f.url)
    .sort((a, b) => b.width - a.width);
  // Widest that still fits a phone-sized slide; failing that the narrowest on
  // offer rather than the widest, since networks do occasionally send only a
  // 4K file and that is 20-odd MB spent to fill a 400px frame. Most send one
  // file per ad, where the two rules pick the same thing.
  return files.find(f => f.width <= 1280) || files[files.length - 1] || null;
}

export const hmsToSeconds = hms => {
  const parts = String(hms).split(':').map(Number);
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : NaN;
};

// VAST states skippability as either a timestamp or a percentage of the ad's
// own duration. Absent means the viewer must sit through it.
export function parseSkipOffset(raw, duration) {
  if (!raw) return null;
  if (raw.trim().endsWith('%')) {
    const pct = parseFloat(raw);
    return isFinite(pct) && isFinite(duration) ? (duration * pct) / 100 : null;
  }
  const secs = hmsToSeconds(raw);
  return isFinite(secs) ? secs : null;
}

// Networks routinely answer with a Wrapper pointing at another ad server
// instead of the ad itself, and every hop carries trackers that must fire
// alongside the final ad's own.
export async function resolveVast(url, depth = 0) {
  if (depth > 4) return null;
  let doc;
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) return null;
    doc = new DOMParser().parseFromString(await res.text(), 'text/xml');
  } catch {
    return null; // network error, or a tag server that withholds CORS headers
  }

  const ad = doc.querySelector('Ad');
  if (!ad) return null; // empty VAST: no fill
  const trackers = collectTrackers(ad);

  const wrapper = ad.querySelector('Wrapper > VASTAdTagURI');
  if (wrapper) {
    const inner = await resolveVast(nodeText(wrapper), depth + 1);
    return inner && Object.assign({}, inner, {
      trackers: mergeTrackers(trackers, inner.trackers),
    });
  }

  const media = pickMedia(ad);
  if (!media) return null;
  const linear = ad.querySelector('Linear');
  return {
    media,
    trackers,
    clickThrough: nodeText(ad.querySelector('ClickThrough')),
    skipAfter: parseSkipOffset(
      linear && linear.getAttribute('skipoffset'),
      hmsToSeconds(nodeText(ad.querySelector('Duration')))
    ),
  };
}

// Rotate which source is asked first. Always starting at the top of the list
// would serve one zone's creative over and over and leave the rest for fallback
// only; this spreads slides across every source and still walks the others when
// one comes back empty.
let tagCursor = 0;

export async function loadVideoAd() {
  const start = tagCursor++;
  for (let i = 0; i < VAST_TAGS.length; i++) {
    const ad = await resolveVast(VAST_TAGS[(start + i) % VAST_TAGS.length]());
    if (ad) return ad;
  }
  return null;
}
