'use client';

import { useState } from 'react';
import { BrickThumbnail } from '@/components/FakeAdSlide';

// A bought ad shows its captured frame when there is one. When the network
// withheld CORS headers there's no frame to show, so the ad replays instead —
// playing a cross-origin video is allowed, only reading its pixels isn't. A
// fake ad has no frame to capture at all — it's a live CSS scene, not a
// <video> — so it carries its config instead and gets a static shot of the
// brick rather than a screenshot.
function Thumb({ item }) {
  if (item.kind === 'fake') return <BrickThumbnail config={item.config} />;
  if (item.poster) return <img src={item.poster} alt="Bought ad" />;
  return <video src={item.mediaUrl} muted playsInline preload="metadata" />;
}

export default function InventoryOverlay({ open, items, onClose }) {
  const [selected, setSelected] = useState(null);

  // Unmounted while closed, so a shelf full of videos isn't holding buffers
  // open behind the feed.
  if (!open) return null;

  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <div className="inv-overlay">
      <div className="inv-head">
        <span>🎒 Inventory ({items.length})</span>
        <button className="inv-close" onClick={close}>×</button>
      </div>

      {items.length === 0 ? (
        <div className="inv-empty">
          No ads yet. Hit “Buy ad” on a video slide to start collecting.
        </div>
      ) : (
        <div className="inv-grid">
          {items.map(item => (
            <button key={item.id} className="inv-item" onClick={() => setSelected(item)}>
              <Thumb item={item} />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="inv-full" onClick={() => setSelected(null)}>
          {selected.kind === 'fake' ? (
            <div className="inv-full-fake">
              <BrickThumbnail config={selected.config} />
            </div>
          ) : selected.poster ? (
            <img src={selected.poster} alt="Bought ad" />
          ) : (
            <video src={selected.mediaUrl} autoPlay muted loop playsInline controls />
          )}
        </div>
      )}
    </div>
  );
}
