'use client';

import { FRAMES } from '@/lib/frames';

const GROUPS = ['Minimal', 'Pixel', 'Guld'];

// Browsers won't let anything make a sound until the page has been clicked or
// tapped, and scrolling doesn't count — a reader could wheel through the whole
// feed in silence and never know sound existed. One button buys the permission
// for everything behind it: the coins, and the ads with their sound on.
//
// And since there's a stop here anyway, it's where the frame gets picked. The
// gate comes back on every load, so trying another one is a reload away.
export default function StartGate({ frame, onFrameChange, onStart }) {
  return (
    <div className="start-gate">
      <div className="start-gate-inner">
        <div className="start-gate-title">Doomscroller</div>
        <p className="start-gate-copy">
          Ads, with the sound on. Scroll to fill the sack.
        </p>

        <div className="frame-picker">
          {GROUPS.map(group => (
            <div className="frame-group" key={group}>
              <div className="frame-group-name">{group}</div>
              <div className="frame-chips">
                {FRAMES.filter(f => f.group === group).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`frame-chip${f.id === frame ? ' is-on' : ''}`}
                    onClick={() => onFrameChange(f.id)}
                    title={f.note}
                  >
                    <span className="frame-chip-id">{f.id}</span>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="start-btn" onClick={onStart} autoFocus>
          Start
        </button>
        <p className="start-gate-fine">You can mute at any time.</p>
      </div>
    </div>
  );
}
