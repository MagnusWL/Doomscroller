'use client';

import { AGE_GROUPS } from '@/lib/ages';

// Covers the whole viewport until an age is picked, then slides up and away
// — the same direction as the feed itself — to reveal slide 1 already
// sitting underneath, so "starting" reads as the first scroll rather than a
// separate loading step.
export default function StartScreen({ leaving, onSelect }) {
  return (
    <div className={`start-screen${leaving ? ' leaving' : ''}`}>
      <div className="start-header">
        <h1 className="start-title">Adscroller</h1>
        <p className="start-subtitle">How old are you?</p>
      </div>
      <div className="age-grid">
        {AGE_GROUPS.map(g => (
          <button
            key={g.key}
            className="age-btn"
            style={{ '--age-from': g.from, '--age-to': g.to }}
            onClick={() => onSelect(g.key)}
          >
            <span className="age-icon">{g.icon}</span>
            <span className="age-label">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
