'use client';

// Browsers won't let anything make a sound until the page has been clicked or
// tapped, and scrolling doesn't count — a reader could wheel through the whole
// feed in silence and never know sound existed. One button buys the permission
// for everything behind it: the coins, and the ads with their sound on.
export default function StartGate({ onStart }) {
  return (
    <div className="start-gate">
      <div className="start-gate-inner">
        <div className="start-gate-title">Doomscroller</div>
        <p className="start-gate-copy">
          Ads, with the sound on. Scroll to fill the sack.
        </p>
        <button className="start-btn" onClick={onStart} autoFocus>
          Start
        </button>
        <p className="start-gate-fine">You can mute at any time.</p>
      </div>
    </div>
  );
}
