'use client';

import { useEffect, useRef, useState } from 'react';
import { loadVideoAd } from '@/lib/vast';
import { priceFor } from '@/lib/pricing';
import AdPriceButton from '@/components/AdPriceButton';

const px = url => { new Image().src = url; };

// Requesting every ad up front would spend advertiser budget on impressions
// nobody sees, and a wall of autoplaying video gets throttled by the
// browser. So this only fetches once it reaches the screen, and pauses
// again whenever it scrolls out of view.
export default function VideoAdSlide({ feedRef, slideId, onSkip, onFilled, coins, onBuyAd, buying }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const fired = useRef(new Set());

  const [ad, setAd] = useState(null);
  const [requested, setRequested] = useState(false);
  const [noFill, setNoFill] = useState(false);
  const [muted, setMuted] = useState(true);
  const [skipSecondsLeft, setSkipSecondsLeft] = useState(null);

  // Held in a ref so a caller passing an inline arrow doesn't rebuild the
  // observer on every render.
  const onFilledRef = useRef(onFilled);
  onFilledRef.current = onFilled;

  useEffect(() => {
    const feed = feedRef.current;
    const root = rootRef.current;
    if (!feed || !root) return;

    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        if (!requested) {
          setRequested(true);
          loadVideoAd().then(result => {
            if (result) {
              setAd(result);
              onFilledRef.current();
            } else {
              setNoFill(true);
            }
          });
        } else if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      } else if (videoRef.current) {
        videoRef.current.pause();
      }
    }, { root: feed, threshold: 0.6 });

    observer.observe(root);
    return () => observer.disconnect();
  }, [feedRef, requested]);

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
    setMuted(prev => {
      const next = !prev;
      fireEvery(next ? 'mute' : 'unmute');
      return next;
    });
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
  const price = priceFor(slideId);

  return (
    <div
      className="vad"
      ref={rootRef}
      style={ad.clickThrough ? { cursor: 'pointer' } : undefined}
      onClick={handleRootClick}
    >
      <video
        ref={videoRef}
        src={ad.media.url}
        muted={muted}
        playsInline
        preload="auto"
        autoPlay
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="vad-badge">Ad</div>
      <AdPriceButton
        slideId={slideId}
        price={price}
        coins={coins}
        onBuy={(e) => {
          e.stopPropagation();
          onBuyAd(slideId, price);
        }}
        disabled={buying}
      />
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
