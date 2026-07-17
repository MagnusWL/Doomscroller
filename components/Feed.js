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
import { priceFor, AUTOSCROLL_PRICE } from '@/lib/pricing';
import AdCoinCounter from '@/components/AdCoinCounter';
import ScrollHint from '@/components/ScrollHint';
import VideoAdSlide from '@/components/VideoAdSlide';
import FakeAdSlide from '@/components/FakeAdSlide';
import AutoScrollToggle from '@/components/AutoScrollToggle';
import BuyAdButton from '@/components/BuyAdButton';
import InventoryButton from '@/components/InventoryButton';
import InventoryOverlay from '@/components/InventoryOverlay';

export default function Feed() {
  const feedRef = useRef(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollUnlocked, setAutoScrollUnlocked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [buying, setBuying] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [filled, setFilled] = useState(() => new Set());

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

  const handleBuyAdWithPrice = async (slideId, price) => {
    if (coins.coins < price) return;
    coins.spend(price);
    setBuying(true);
    try {
      const ad = await captureActiveAd(feedRef.current);
      if (ad) inventory.add(ad);
    } finally {
      setBuying(false);
    }
  };

  // Same gate the on-video price button uses: there's nothing to capture
  // until the ad has arrived, and no buying it without the coins to cover it.
  const currentSlideId = slides[activeIndex];
  const currentPrice = currentSlideId != null ? priceFor(currentSlideId) : 0;
  const adLoaded = currentSlideId != null && filled.has(currentSlideId);
  const canAfford = coins.coins >= currentPrice;

  const handleBuyAutoscroll = () => {
    if (coins.coins < AUTOSCROLL_PRICE) return;
    coins.spend(AUTOSCROLL_PRICE);
    setAutoScrollUnlocked(true);
    setAutoScroll(true); // switch it on immediately — that's what was just bought
  };

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
                slideId={id}
                onSkip={handleSkip}
                onFilled={() => markFilled(id)}
                coins={coins.coins}
                onBuyAd={handleBuyAdWithPrice}
                buying={buying}
              />
            )}
          </section>
        ))}
        <div ref={sentinelRef} />
      </div>

      <AdCoinCounter coins={coins.coins} />
      <ScrollHint visible={hintVisible} />

      <div className="bottom-actions">
        <BuyAdButton
          price={currentPrice}
          adLoaded={adLoaded}
          canAfford={canAfford}
          busy={buying}
          onClick={() => handleBuyAdWithPrice(currentSlideId, currentPrice)}
        />
        <InventoryButton count={inventory.count} onClick={() => setInventoryOpen(true)} />
        <AutoScrollToggle
          unlocked={autoScrollUnlocked}
          enabled={autoScroll}
          onChange={setAutoScroll}
          coins={coins.coins}
          price={AUTOSCROLL_PRICE}
          onBuy={handleBuyAutoscroll}
        />
      </div>

      <InventoryOverlay
        open={inventoryOpen}
        items={inventory.items}
        onClose={() => setInventoryOpen(false)}
      />
    </>
  );
}
