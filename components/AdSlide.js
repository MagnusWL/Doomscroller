'use client';

import { useEffect } from 'react';
import { runBanners } from '@/lib/adcash';

export default function AdSlide({ id }) {
  const slotA = `ac-slot-${id}-a`;
  const slotB = `ac-slot-${id}-b`;

  useEffect(() => {
    runBanners([slotA, slotB]);
  }, [slotA, slotB]);

  return (
    <div className="ad">
      <div className="ac-slot" id={slotA} />
      <div className="ac-slot" id={slotB} />
    </div>
  );
}
