'use client';

import { useEffect, useRef, useState } from 'react';
import { useBrainrot } from '@/hooks/useBrainrot';
import { useSlideProgress } from '@/hooks/useSlideProgress';
import { useInfiniteSlides } from '@/hooks/useInfiniteSlides';
import { randomLecture } from '@/lib/lectures';
import BrainStatsBar from '@/components/BrainStatsBar';
import RefillButton from '@/components/RefillButton';
import LectureModal from '@/components/LectureModal';
import ScrollHint from '@/components/ScrollHint';
import AdSlide from '@/components/AdSlide';
import VideoAdSlide from '@/components/VideoAdSlide';

export default function Feed() {
  const feedRef = useRef(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [lectureVideoId, setLectureVideoId] = useState(null);

  const brainrot = useBrainrot();
  const observeSlide = useSlideProgress(feedRef, brainrot.advance);
  const { slides, sentinelRef, markSlideAsBanner } = useInfiniteSlides(feedRef);

  // Always start at the first ad, even after a reload.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
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

  return (
    <>
      <div id="feed" ref={feedRef} onScroll={() => setHintVisible(false)}>
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
      <RefillButton visible={brainrot.depleted} onClick={handleRefillClick} />
      <LectureModal videoId={lectureVideoId} onClose={handleCloseLecture} />
      <ScrollHint visible={hintVisible} />
    </>
  );
}
