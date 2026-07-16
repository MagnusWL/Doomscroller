'use client';

import { useState } from 'react';

// A bought ad shows its captured frame when there is one. When the network
// withheld CORS headers there's no frame to show, so the ad replays instead —
// playing a cross-origin video is allowed, only reading its pixels isn't.
function Thumb({ item }) {
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
          {selected.poster ? (
            <img src={selected.poster} alt="Bought ad" />
          ) : (
            <video src={selected.mediaUrl} autoPlay muted loop playsInline controls />
          )}
        </div>
      )}
    </div>
  );
}
