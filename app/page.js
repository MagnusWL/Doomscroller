'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const feedRef = useRef(null);
  const hintRef = useRef(null);
  const brainStatsRef = useRef(null);
  const refillBtnRef = useRef(null);
  const ytModalRef = useRef(null);
  const ytFrameRef = useRef(null);
  const ytModalCloseRef = useRef(null);

  useEffect(() => {
    // Always start at the first ad, even after a reload.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    const feed = feedRef.current;
    const hint = hintRef.current;
    const brainStats = brainStatsRef.current;
    const refillBtn = refillBtnRef.current;
    const ytModal = ytModalRef.current;
    const ytFrame = ytFrameRef.current;
    const ytModalClose = ytModalCloseRef.current;

    const AC_ZONE_ID = '11731342';

    // Ad servers collapse repeat requests carrying the same correlator into one
    // impression and stop filling, so every request needs a fresh one.
    const correlator = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

    // Video ad sources, tried in order until one fills. VAST is an IAB standard,
    // so a new network is one more entry here and nothing else.
    const VAST_TAGS = [
      // Adcash In-stream Video zone 11731718. Unlike the banner zone, this one
      // fills on desktop as well as mobile.
      () => 'https://youradexchange.com/video/select.php?r=11731718',
      // Google's public sample tag, so the feed still shows video when Adcash has
      // nothing to serve. It earns nothing — drop it before this carries real traffic.
      () => 'https://pubads.g.doubleclick.net/gampad/ads' +
            '?iu=/21775744923/external/single_ad_samples&sz=640x480' +
            '&cust_params=sample_ct%3Dlinear&ciu_szs=300x250&gdfp_req=1' +
            `&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=${correlator()}`,
    ];

    const px = url => { new Image().src = url; };
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
      return files.find(f => f.width <= 1280) || files[0] || null;
    }

    const hmsToSeconds = hms => {
      const parts = String(hms).split(':').map(Number);
      return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : NaN;
    };

    // VAST states skippability as either a timestamp or a percentage of the ad's
    // own duration. Absent means the viewer must sit through it.
    function parseSkipOffset(raw, duration) {
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
    async function resolveVast(url, depth = 0) {
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

    async function loadVideoAd() {
      for (const tag of VAST_TAGS) {
        const ad = await resolveVast(tag());
        if (ad) return ad;
      }
      return null;
    }

    function playAd(box, ad) {
      const video = document.createElement('video');
      video.src = ad.media.url;
      video.muted = true; // browsers refuse to autoplay audible video
      video.playsInline = true;
      video.preload = 'auto';

      // Scrolling back to a slide resumes the same video, so every milestone
      // fires at most once per ad — an impression counted twice is a billing lie.
      const fired = new Set();
      const once = (key, urls) => {
        if (fired.has(key)) return;
        fired.add(key);
        urls.forEach(px);
      };
      const fireOnce = ev => once(ev, ad.trackers.events[ev] || []);
      const fireEvery = ev => (ad.trackers.events[ev] || []).forEach(px);

      video.addEventListener('playing', () => {
        once('impression', ad.trackers.impression);
        fireOnce('start');
      });

      video.addEventListener('timeupdate', () => {
        const p = video.currentTime / (video.duration || Infinity);
        if (p >= 0.25) fireOnce('firstQuartile');
        if (p >= 0.5) fireOnce('midpoint');
        if (p >= 0.75) fireOnce('thirdQuartile');
      });

      video.addEventListener('ended', () => fireOnce('complete'));

      const badge = document.createElement('div');
      badge.className = 'vad-badge';
      badge.textContent = 'Ad';

      const sound = document.createElement('button');
      sound.className = 'vad-sound';
      sound.textContent = '🔇';
      sound.addEventListener('click', e => {
        e.stopPropagation();
        video.muted = !video.muted;
        sound.textContent = video.muted ? '🔇' : '🔊';
        fireEvery(video.muted ? 'mute' : 'unmute');
      });

      // Adcash serves creatives up to a minute long. Without a way out, one ad
      // holds the feed hostage for as long as the advertiser paid for.
      const controls = [badge, sound];
      if (ad.skipAfter != null) {
        const skip = document.createElement('button');
        skip.className = 'vad-skip';
        skip.disabled = true;
        skip.textContent = `Skip in ${Math.ceil(ad.skipAfter)}`;
        skip.addEventListener('click', e => {
          e.stopPropagation();
          fireEvery('skip');
          feed.scrollBy({ top: feed.clientHeight, behavior: 'smooth' });
        });
        video.addEventListener('timeupdate', () => {
          const left = Math.ceil(ad.skipAfter - video.currentTime);
          skip.disabled = left > 0;
          skip.textContent = left > 0 ? `Skip in ${left}` : 'Skip ›';
        });
        controls.push(skip);
      }

      if (ad.clickThrough) {
        box.style.cursor = 'pointer';
        box.addEventListener('click', () => {
          ad.trackers.click.forEach(px);
          window.open(ad.clickThrough, '_blank', 'noopener');
        });
      }

      box.textContent = '';
      box.append(video, ...controls);
      video.play().catch(() => {});
      return video;
    }

    // Real, verified-embeddable lectures on famously dry subjects.
    const BORING_LECTURES = [
      'wWnfJ0-xXRE', // MIT 8.01x Physics intro — Walter Lewin
      'IJquEYhiq_U', // MIT cryptocurrency engineering — signatures & hashing
      'kBdfcR-8hEY', // Harvard Justice — Michael Sandel, episode 1
      'ZK3O402wf1c', // MIT 18.06 Linear Algebra — Gilbert Strang, lecture 1
    ];

    // Average human neuron count, used here as a "braincell" starting budget.
    const BRAINCELLS_START = 86_000_000_000;
    const LOSS_FRACTION_START = 0.08;  // % of remaining braincells lost on the first swipe
    const LOSS_FRACTION_GROWTH = 1.3;  // that % grows 30% per swipe — empties out around swipe 10
    const DEPLETED_THRESHOLD = BRAINCELLS_START * 0.005;

    let braincells = BRAINCELLS_START;
    let lossFraction = LOSS_FRACTION_START;
    let lastSeenIndex = 1; // slide 1 is the initial view, not a swipe

    function renderBrainStats() {
      const speed = braincells * lossFraction;
      brainStats.innerHTML =
        `<span><span class="label">🧠 Braincells</span>${Math.round(braincells).toLocaleString()}</span>` +
        `<span><span class="label">📈 Brainrot speed</span>${Math.round(speed).toLocaleString()}/scroll</span>`;
    }

    function decayBrain() {
      if (braincells <= 0) return;
      braincells -= braincells * lossFraction;
      if (braincells < DEPLETED_THRESHOLD) braincells = 0;
      lossFraction = Math.min(1, lossFraction * LOSS_FRACTION_GROWTH);
      renderBrainStats();
      if (braincells <= 0) refillBtn.classList.add('show');
    }

    function onRefillClick() {
      refillBtn.classList.remove('show');
      const id = BORING_LECTURES[Math.floor(Math.random() * BORING_LECTURES.length)];
      ytFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
      ytModal.classList.add('show');
    }

    function onYtModalClose() {
      ytModal.classList.remove('show');
      ytFrame.src = ''; // stop playback
      braincells = BRAINCELLS_START;
      lossFraction = LOSS_FRACTION_START;
      renderBrainStats();
    }

    refillBtn.addEventListener('click', onRefillClick);
    ytModalClose.addEventListener('click', onYtModalClose);

    renderBrainStats();

    let count = 0;

    const bannerSlotIds = index => [`ac-slot-${index}-a`, `ac-slot-${index}-b`];

    const bannerMarkup = index => {
      const [a, b] = bannerSlotIds(index);
      return `
        <div class="ad">
          <div class="ac-slot" id="${a}"></div>
          <div class="ac-slot" id="${b}"></div>
        </div>`;
    };

    // Must run after the slides are in the DOM, since Adcash looks up renderIn by
    // selector. Inline <script> tags don't execute when inserted via innerHTML,
    // hence the programmatic call.
    //
    // aclib.js loads via next/script's "afterInteractive" strategy, so it can
    // still be mid-load — or defined but not yet fully initialized — when the
    // first slides mount. Retry briefly instead of dropping the ad silently.
    function runBanners(slotIds, attempt = 0) {
      if (!slotIds.length) return;
      const aclib = window.aclib;
      if (aclib && typeof aclib.runBanner === 'function') {
        for (const id of slotIds) {
          aclib.runBanner({ zoneId: AC_ZONE_ID, renderIn: `#${id}` });
        }
      } else if (attempt < 20) {
        setTimeout(() => runBanners(slotIds, attempt + 1), 300);
      }
    }

    function addSlides(n) {
      const frag = document.createDocumentFragment();
      const newAdSlots = [];
      for (let i = 0; i < n; i++) {
        count++;
        const slide = document.createElement('section');
        slide.className = 'slide';
        slide.dataset.index = count;

        // Alternate video and the banner pair, so neither format carries the
        // whole feed on its own.
        if (count % 2 === 1) {
          slide.innerHTML = '<div class="vad"></div>';
        } else {
          slide.innerHTML = bannerMarkup(count);
          newAdSlots.push(...bannerSlotIds(count));
        }

        frag.appendChild(slide);
      }
      feed.appendChild(frag);
      observeTail();
      runBanners(newAdSlots);
    }

    // Requesting every ad up front would spend advertiser budget on impressions
    // nobody sees, and a wall of autoplaying video gets throttled by the browser.
    // So a video slide only fetches once it reaches the screen.
    const videoSlides = new IntersectionObserver(entries => {
      for (const e of entries) {
        const box = e.target.querySelector('.vad');
        if (!box) continue;
        const video = box.querySelector('video');
        if (!e.isIntersecting) {
          if (video) video.pause();
        } else if (box.dataset.filled) {
          if (video) video.play().catch(() => {});
        } else {
          box.dataset.filled = '1';
          fillVideoSlide(box);
        }
      }
    }, { root: feed, threshold: 0.6 });

    async function fillVideoSlide(box) {
      const ad = await loadVideoAd();
      if (ad) {
        playAd(box, ad);
        return;
      }
      // No video to show: fall back to the banner pair rather than leave a dead
      // black slide, so the slot still earns.
      const slide = box.closest('.slide');
      const index = slide.dataset.index;
      slide.innerHTML = bannerMarkup(index);
      runBanners(bannerSlotIds(index));
    }

    // Append more ads when the last one scrolls into view — endless feed.
    const tail = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        tail.disconnect();
        addSlides(5);
      }
    }, { root: feed, rootMargin: '400px 0px' });

    // Decay the braincell counter once per newly-reached slide, forward only.
    const progress = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const idx = Number(e.target.dataset.index);
        if (idx > lastSeenIndex) {
          lastSeenIndex = idx;
          decayBrain();
        }
      }
    }, { root: feed, threshold: 0.6 });

    function observeTail() {
      const slides = feed.querySelectorAll('.slide');
      slides.forEach(s => {
        progress.observe(s);
        if (s.querySelector('.vad')) videoSlides.observe(s);
      });
      tail.observe(slides[slides.length - 1]);
    }

    // Arrow keys / space, for desktop.
    function onKeyDown(e) {
      const step = { ArrowDown: 1, ArrowUp: -1, ' ': 1, PageDown: 1, PageUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      feed.scrollBy({ top: step * feed.clientHeight, behavior: 'smooth' });
    }
    window.addEventListener('keydown', onKeyDown);

    function onFirstScroll() {
      hint.classList.add('gone');
    }
    feed.addEventListener('scroll', onFirstScroll, { once: true });

    addSlides(8);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      feed.removeEventListener('scroll', onFirstScroll);
      refillBtn.removeEventListener('click', onRefillClick);
      ytModalClose.removeEventListener('click', onYtModalClose);
      tail.disconnect();
      progress.disconnect();
      videoSlides.disconnect();
    };
  }, []);

  return (
    <>
      <div id="feed" ref={feedRef} />
      <div className="brain-stats" id="brainStats" ref={brainStatsRef} />
      <button className="refill-btn" id="refillBtn" ref={refillBtnRef}>
        🧠 Get more braincells
      </button>
      <div className="yt-modal" id="ytModal" ref={ytModalRef}>
        <div className="yt-modal-box">
          <button className="yt-modal-close" id="ytModalClose" ref={ytModalCloseRef}>
            ×
          </button>
          <iframe
            id="ytFrame"
            ref={ytFrameRef}
            src=""
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
      <div className="hint" id="hint" ref={hintRef}>
        Swipe or press ↓ for the next ad
      </div>
    </>
  );
}
