'use client';

import { useEffect, useRef, useState } from 'react';
import { loadVideoAd } from '@/lib/vast';
import { shouldCover } from '@/lib/fit';
import { pictureBounds, placePicture } from '@/lib/letterbox';

const BACKDROP_ZOOM = 1.18; // past the edges: a blur this wide leaves them soft

// One screen's warning. Enough for the VAST call, the download and the pixel
// probe to finish before the slide is reached; short enough that a reader who
// stops scrolling hasn't pulled down much they'll never look at.
const PREFETCH_AHEAD = '100%';

const px = url => { new Image().src = url; };

// Requesting every ad up front would spend advertiser budget on impressions
// nobody sees, and a wall of autoplaying video gets throttled by the
// browser. So this only fetches once it reaches the screen, and pauses
// again whenever it scrolls out of view.
export default function VideoAdSlide({ feedRef, started, muted, onMutedChange, onSkip, onFilled }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const backdropRef = useRef(null);
  const fired = useRef(new Set());

  const onMutedChangeRef = useRef(onMutedChange);
  onMutedChangeRef.current = onMutedChange;

  // The backdrop is the same footage, so it starts and stops with the ad
  // rather than decoding on its own schedule. It's always silent.
  const playAll = () => {
    if (backdropRef.current) backdropRef.current.play().catch(() => {});
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Refused because it would make a sound. The gate is meant to have
      // bought that right already, but a browser that disagrees should cost
      // the sound, not the ad — a silent ad beats a frozen frame.
      video.muted = true;
      onMutedChangeRef.current(true);
      video.play().catch(() => {});
    });
  };
  const pauseAll = () => {
    for (const ref of [videoRef, backdropRef]) {
      if (ref.current) ref.current.pause();
    }
  };

  const [ad, setAd] = useState(null);
  const [requested, setRequested] = useState(false);
  const [noFill, setNoFill] = useState(false);
  const [skipSecondsLeft, setSkipSecondsLeft] = useState(null);
  // undefined while the probe is still running, null once it has come back
  // empty — the two mean different things, and only the first is worth waiting
  // on.
  const [probed, setProbed] = useState(undefined);
  const [intrinsic, setIntrinsic] = useState(null);
  const [box, setBox] = useState(null);

  useEffect(() => {
    if (!ad) return;
    let live = true;
    pictureBounds(ad.media.url).then(result => {
      if (live) setProbed(result || null);
    });
    return () => { live = false; };
  }, [ad]);

  // The fallback when the pixels can't be read: trust the file.
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && video.videoWidth) {
      setIntrinsic({ w: video.videoWidth, h: video.videoHeight });
    }
  };

  const bounds = probed === undefined
    ? null
    : probed ||
      (intrinsic ? { file: intrinsic, picture: { x: 0, y: 0, ...intrinsic } } : null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const r = root.getBoundingClientRect();
      if (r.width && r.height) setBox({ w: r.width, h: r.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [ad]);

  // The file's declared shape is the canvas the advertiser used, not the shape
  // of what they drew on it. Fit the picture.
  const layout = bounds && box
    ? (() => {
        const { file, picture } = bounds;
        const mode = shouldCover(picture.w / picture.h, box.w / box.h) ? 'cover' : 'contain';
        return {
          mode,
          media: placePicture({ file, picture, box, mode }),
          backdrop: placePicture({ file, picture, box, mode: 'cover', zoom: BACKDROP_ZOOM }),
        };
      })()
    : null;
  const covers = layout ? layout.mode === 'cover' : false;

  // Held in a ref so a caller passing an inline arrow doesn't rebuild the
  // observer on every render.
  const onFilledRef = useRef(onFilled);
  onFilledRef.current = onFilled;

  // Fetching only once the slide was on screen meant the reader watched the ad
  // arrive: the VAST call, the download and the measurement all happened with
  // them staring at black. A screen's warning is enough for all of it to be
  // over before they get here.
  useEffect(() => {
    const feed = feedRef.current;
    const root = rootRef.current;
    if (!feed || !root || requested) return;

    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      setRequested(true);
      loadVideoAd().then(result => {
        if (result) {
          setAd(result);
          onFilledRef.current();
        } else {
          setNoFill(true);
        }
      });
    }, { root: feed, rootMargin: `${PREFETCH_AHEAD} 0px` });

    observer.observe(root);
    return () => observer.disconnect();
  }, [feedRef, requested]);

  // Playback follows what's actually on screen, never the browser's autoplay:
  // an ad fetched a screen early would otherwise start on its own and bill the
  // advertiser for an impression nobody could have seen. Nothing plays before
  // the gate either — an ad running behind it would be spending an impression
  // on a covered screen.
  useEffect(() => {
    const feed = feedRef.current;
    const root = rootRef.current;
    if (!feed || !root || !ad || !started) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) playAll();
      else pauseAll();
    }, { root: feed, threshold: 0.6 });

    observer.observe(root);
    return () => observer.disconnect();
  }, [feedRef, ad, started]);

  // Matches the disabled "Skip in N" countdown the original imperative
  // player showed before the first timeupdate tick.
  useEffect(() => {
    if (ad && ad.skipAfter != null) setSkipSecondsLeft(Math.ceil(ad.skipAfter));
  }, [ad]);

  // Every network came back empty. There's no banner to fall back to any more,
  // so say so rather than leaving a black slide with no explanation.
  if (!ad) {
    return (
      <div className="vad" ref={rootRef}>
        {noFill && <span className="vad-empty">No ad available</span>}
      </div>
    );
  }

  // Scrolling back to a slide resumes the same video, so every milestone
  // fires at most once per ad — an impression counted twice is a billing lie.
  const once = (key, urls) => {
    if (fired.current.has(key)) return;
    fired.current.add(key);
    urls.forEach(px);
  };
  const fireOnce = ev => once(ev, ad.trackers.events[ev] || []);
  const fireEvery = ev => (ad.trackers.events[ev] || []).forEach(px);

  const handlePlaying = () => {
    once('impression', ad.trackers.impression);
    fireOnce('start');
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const p = video.currentTime / (video.duration || Infinity);
    if (p >= 0.25) fireOnce('firstQuartile');
    if (p >= 0.5) fireOnce('midpoint');
    if (p >= 0.75) fireOnce('thirdQuartile');

    if (ad.skipAfter != null) {
      setSkipSecondsLeft(Math.ceil(ad.skipAfter - video.currentTime));
    }
  };

  const handleEnded = () => fireOnce('complete');

  const toggleMute = e => {
    e.stopPropagation();
    const next = !muted;
    fireEvery(next ? 'mute' : 'unmute');
    onMutedChange(next);
  };

  const handleSkipClick = e => {
    e.stopPropagation();
    fireEvery('skip');
    onSkip();
  };

  const handleRootClick = () => {
    if (!ad.clickThrough) return;
    ad.trackers.click.forEach(px);
    window.open(ad.clickThrough, '_blank', 'noopener');
  };

  const skipReady = skipSecondsLeft != null && skipSecondsLeft <= 0;

  return (
    <div
      className={`vad${layout ? ' vad-ready' : ''}`}
      ref={rootRef}
      style={ad.clickThrough ? { cursor: 'pointer' } : undefined}
      onClick={handleRootClick}
    >
      {/* The same footage, blown up and blurred to fill the window behind a
          letterboxed ad. An ad that covers hides it completely, so it isn't
          rendered — a whole video decode saved. */}
      {!covers && (
        <video
          ref={backdropRef}
          className="vad-backdrop"
          style={layout ? layout.backdrop : undefined}
          src={ad.media.url}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      <video
        ref={videoRef}
        className="vad-media"
        style={layout ? layout.media : undefined}
        src={ad.media.url}
        muted={muted}
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="vad-badge">Ad</div>
      <button className="vad-sound" onClick={toggleMute}>
        {muted ? '🔇' : '🔊'}
      </button>
      {ad.skipAfter != null && (
        <button className="vad-skip" disabled={!skipReady} onClick={handleSkipClick}>
          {skipReady ? 'Skip ›' : `Skip in ${skipSecondsLeft}`}
        </button>
      )}
    </div>
  );
}
