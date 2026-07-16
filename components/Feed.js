'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSlideProgress } from '@/hooks/useSlideProgress';
import { useInfiniteSlides } from '@/hooks/useInfiniteSlides';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useInventory } from '@/hooks/useInventory';
import { useAdCoins } from '@/hooks/useAdCoins';
import { useFakeAds } from '@/hooks/useFakeAds';
import { runVideoSlider } from '@/lib/adcash';
import { captureActiveAd } from '@/lib/capture';
import AdCoinCounter from '@/components/AdCoinCounter';
import ScrollHint from '@/components/ScrollHint';
import VideoAdSlide from '@/components/VideoAdSlide';
import FakeAdSlide from '@/components/FakeAdSlide';
import AutoScrollToggle from '@/components/AutoScrollToggle';
import BuyAdButton from '@/components/BuyAdButton';
import InventoryButton from '@/components/InventoryButton';
import InventoryOverlay from '@/components/InventoryOverlay';
import StartGate from '@/components/StartGate';

export default function Feed() {
  const feedRef = useRef(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [buying, setBuying] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [filled, setFilled] = useState(() => new Set());
  const [started, setStarted] = useState(false);
  // One setting for the whole feed rather than one per slide: muting an ad you
  // don't want to hear should mean the next one is quiet too. Starts on,
  // because the gate's click is what earns the right to play it.
  const [muted, setMuted] = useState(false);

  const coins = useAdCoins();
  const observeSlide = useSlideProgress(feedRef, coins.award);
  const { slides, sentinelRef } = useInfiniteSlides(feedRef);
  useAutoScroll(feedRef, autoScroll);
  const inventory = useInventory();
  const isFake = useFakeAds();

  const markFilled = useCallback(id => {
    setFilled(prev => new Set(prev).add(id));
  }, []);

  // Always start at the first ad, even after a reload.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  // The slider belongs to the page rather than any slide, so it starts once
  // with the feed and Adcash decides where to put it.
  useEffect(() => {
    runVideoSlider();
  }, []);

  // Arrow keys / space, for desktop.
  useEffect(() => {
    function onKeyDown(e) {
      const step = { ArrowDown: 1, ArrowUp: -1, ' ': 1, PageDown: 1, PageUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      feedRef.current.scrollBy({ top: step * feedRef.current.clientHeight, behavior: 'smooth' });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSkip = () => {
    feedRef.current.scrollBy({ top: feedRef.current.clientHeight, behavior: 'smooth' });
  };

  // Setting the index to the value it already holds is a no-op re-render-wise,
  // so this runs free on the scroll events between slide boundaries.
  const handleFeedScroll = () => {
    setHintVisible(false);
    const feed = feedRef.current;
    setActiveIndex(Math.round(feed.scrollTop / feed.clientHeight));
  };

  const handleBuyAd = async () => {
    setBuying(true);
    try {
      const ad = await captureActiveAd(feedRef.current);
      if (ad) inventory.add(ad);
    } finally {
      setBuying(false);
    }
  };

  // There's nothing to capture until the ad for this slide has arrived.
  const buyable = filled.has(slides[activeIndex]);

  return (
    <>
      <div id="feed" ref={feedRef} onScroll={handleFeedScroll}>
        {slides.map(id => (
          <section key={id} className="slide" data-index={id} ref={observeSlide}>
            {isFake(id) ? (
              <FakeAdSlide feedRef={feedRef} />
            ) : (
              <VideoAdSlide
                feedRef={feedRef}
                started={started}
                muted={muted}
                onMutedChange={setMuted}
                onSkip={handleSkip}
                onFilled={() => markFilled(id)}
              />
            )}
          </section>
        ))}
        <div ref={sentinelRef} />
      </div>

      <ScrollHint visible={hintVisible} />

      <div className="action-bar">
        <div className="bar-actions">
          <InventoryButton count={inventory.count} onClick={() => setInventoryOpen(true)} />
          <AutoScrollToggle enabled={autoScroll} onChange={setAutoScroll} />
        </div>
      </div>

      <AdCoinCounter coins={coins.coins} />

      <div className="bottom-bar">
        <BuyAdButton disabled={!buyable} busy={buying} onClick={handleBuyAd} />
      </div>

      <InventoryOverlay
        open={inventoryOpen}
        items={inventory.items}
        onClose={() => setInventoryOpen(false)}
      />

      {/* Over the feed rather than instead of it, so the first ad is fetched
          and measured while the gate is still up and is there on the first
          swipe. */}
      {!started && <StartGate onStart={() => setStarted(true)} />}
    </>
  );
}
