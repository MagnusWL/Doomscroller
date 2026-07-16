'use client';

import { useEffect, useRef, useState } from 'react';
import { useBrainrot } from '@/hooks/useBrainrot';
import { useSlideProgress } from '@/hooks/useSlideProgress';
import { useInfiniteSlides } from '@/hooks/useInfiniteSlides';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useInventory } from '@/hooks/useInventory';
import { randomLecture } from '@/lib/lectures';
import { runVideoSlider } from '@/lib/adcash';
import { captureActiveAd } from '@/lib/capture';
import BrainStatsBar from '@/components/BrainStatsBar';
import RefillButton from '@/components/RefillButton';
import LectureModal from '@/components/LectureModal';
import ScrollHint from '@/components/ScrollHint';
import AdSlide from '@/components/AdSlide';
import VideoAdSlide from '@/components/VideoAdSlide';
import AutoScrollToggle from '@/components/AutoScrollToggle';
import BuyAdButton from '@/components/BuyAdButton';
import InventoryButton from '@/components/InventoryButton';
import InventoryOverlay from '@/components/InventoryOverlay';

export default function Feed() {
  const feedRef = useRef(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [lectureVideoId, setLectureVideoId] = useState(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [buying, setBuying] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const brainrot = useBrainrot();
  const observeSlide = useSlideProgress(feedRef, brainrot.advance);
  const { slides, sentinelRef, markSlideAsBanner } = useInfiniteSlides(feedRef);
  useAutoScroll(feedRef, autoScroll);
  const inventory = useInventory();

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

  const handleRefillClick = () => {
    setLectureVideoId(randomLecture());
  };

  const handleCloseLecture = () => {
    setLectureVideoId(null);
    brainrot.refill();
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

  // Banners live in cross-origin iframes with no way to read their pixels, so
  // there's nothing to hand the inventory.
  const buyable = slides[activeIndex] && slides[activeIndex].type === 'video';

  return (
    <>
      <div id="feed" ref={feedRef} onScroll={handleFeedScroll}>
        {slides.map(s => (
          <section key={s.id} className="slide" data-index={s.id} ref={observeSlide}>
            {s.type === 'video' ? (
              <VideoAdSlide
                feedRef={feedRef}
                onSkip={handleSkip}
                onNoFill={() => markSlideAsBanner(s.id)}
              />
            ) : (
              <AdSlide id={s.id} />
            )}
          </section>
        ))}
        <div ref={sentinelRef} />
      </div>

      <BrainStatsBar braincells={brainrot.braincells} brainrotSpeed={brainrot.brainrotSpeed} />

      <div className="top-actions">
        <BuyAdButton disabled={!buyable} busy={buying} onClick={handleBuyAd} />
        <InventoryButton count={inventory.count} onClick={() => setInventoryOpen(true)} />
      </div>

      <AutoScrollToggle enabled={autoScroll} onChange={setAutoScroll} />
      <RefillButton visible={brainrot.depleted} onClick={handleRefillClick} />
      <LectureModal videoId={lectureVideoId} onClose={handleCloseLecture} />
      <InventoryOverlay
        open={inventoryOpen}
        items={inventory.items}
        onClose={() => setInventoryOpen(false)}
      />
      <ScrollHint visible={hintVisible} />
    </>
  );
}
