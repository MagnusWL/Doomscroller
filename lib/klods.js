// KLODS — "The Brick": tokens, copy and motion maths for the fake product ad.
// Ported from the design handoff in "FAKE ADS/THE BRICK". The handoff ships a
// prototype built on its own timeline engine; per its instructions only the
// motion maths is reproduced here, not that engine.
//
// Pure data-in, data-out — every value below is a function of (progress,
// localTime) and the config, which is what lets the piece loop deterministically.

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const Easing = {
  linear: t => t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t). Maps t across input
// keyframes to output values, easing each segment.
export function interpolate(input, output, ease = Easing.linear) {
  return t => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        return output[i] + (output[i + 1] - output[i]) * easeFn(local);
      }
    }
    return output[output.length - 1];
  };
}

// Normalised ramp: 0 before a, 1 after b.
export const R = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
// 0 → 1 → 0 across [0,1], for flashes and sweeps.
export const bell = t => Math.sin(clamp(t, 0, 1) * Math.PI);

export function hexA(hex, a) {
  const h = (hex || '#ecd7ad').replace('#', '');
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(s, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// The stage is authored at 1080×1920 and scaled to whatever the slide gives it,
// so every size below is in design pixels rather than CSS pixels.
export const STAGE_W = 1080;
export const STAGE_H = 1920;

export const SCENES = [
  { name: 'Open', dur: 1.8 },
  { name: 'Reveal', dur: 3 },
  { name: 'Name', dur: 2.4 },
  { name: 'Specs', dur: 5.4 },
  { name: 'Tagline', dur: 2.8 },
  { name: 'Price', dur: 3.4 },
];

export const TOTAL_DUR = SCENES.reduce((sum, s) => sum + s.dur, 0);

// Hard cuts: exactly one scene is visible at a time.
export function sceneAt(t) {
  let acc = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t < acc + SCENES[i].dur) {
      return { index: i, progress: (t - acc) / SCENES[i].dur, localTime: t - acc };
    }
    acc += SCENES[i].dur;
  }
  const last = SCENES.length - 1;
  return { index: last, progress: 1, localTime: SCENES[last].dur };
}

// On the dark bg the warm spotlight is drawn additively. On the light bg a
// bright warm colour is invisible, so it composites with multiply and is
// boosted — it reads as a pool of light tinting the cream. Any light-mode glow
// must use multiply or it disappears.
export const THEMES = {
  Dark: {
    bg: '#09090b', ink: '#f2ece1', mut: '#a29a8c', dim: '#6f685d', hairRGB: '242,236,225',
    vignette: 'radial-gradient(120% 90% at 50% 42%, transparent 44%, rgba(0,0,0,0.55) 100%)',
    bloomK: 1, shadowA: 0.72, glowBlend: 'normal', spotA: 1,
  },
  Light: {
    bg: '#ede6d8', ink: '#221e17', mut: '#6f6656', dim: '#a99f8c', hairRGB: '34,30,23',
    vignette: 'radial-gradient(125% 98% at 50% 40%, transparent 46%, rgba(74,62,44,0.22) 100%)',
    bloomK: 1.2, shadowA: 0.24, glowBlend: 'multiply', spotA: 1.5,
  },
};

export const TONES = {
  Clay: {
    front: 'linear-gradient(157deg,#c26c46 0%,#a4522f 52%,#8a4526 100%)',
    top: 'linear-gradient(160deg,#dc9163 0%,#c1734a 100%)',
    side: 'linear-gradient(158deg,#7c4025 0%,#5c2c17 100%)',
    bottom: 'linear-gradient(158deg,#54301c 0%,#3a1e10 100%)',
  },
  Charcoal: {
    front: 'linear-gradient(157deg,#3d3d43 0%,#28282d 55%,#1d1d21 100%)',
    top: 'linear-gradient(160deg,#54545c 0%,#3a3a41 100%)',
    side: 'linear-gradient(158deg,#242429 0%,#151518 100%)',
    bottom: 'linear-gradient(158deg,#161619 0%,#0d0d10 100%)',
  },
  Sandstone: {
    front: 'linear-gradient(157deg,#d0b88d 0%,#b5996c 55%,#9e8258 100%)',
    top: 'linear-gradient(160deg,#e6cf9f 0%,#cbb083 100%)',
    side: 'linear-gradient(158deg,#917853 0%,#6f5a3c 100%)',
    bottom: 'linear-gradient(158deg,#6a5439 0%,#4c3c28 100%)',
  },
};

// Worn, weathered surface layered into every face below the tone gradient:
// mottled blotches plus a fine speckle, rgba-based so it works on any tone.
export const WORN = [
  'radial-gradient(ellipse 42% 34% at 24% 30%, rgba(255,255,255,0.055), transparent 60%)',
  'radial-gradient(ellipse 36% 42% at 76% 66%, rgba(0,0,0,0.18), transparent 62%)',
  'radial-gradient(ellipse 30% 26% at 58% 16%, rgba(0,0,0,0.13), transparent 60%)',
  'radial-gradient(ellipse 26% 36% at 15% 82%, rgba(0,0,0,0.15), transparent 60%)',
  'radial-gradient(ellipse 20% 18% at 88% 24%, rgba(255,255,255,0.04), transparent 60%)',
  'radial-gradient(rgba(255,255,255,0.05) 0.5px, transparent 0.6px)',
];
export const WORN_SZ = ['100% 100%', '100% 100%', '100% 100%', '100% 100%', '100% 100%', '5px 5px'];

export const SPECS = [
  { disp: '∞', label: 'Battery life', sub: 'Never charge again', kind: 'text' },
  { disp: '0', label: 'Notifications', sub: 'By design', kind: 'text' },
  { n: 2.4, dec: 1, unit: ' kg', label: 'Certified heft', sub: 'You can feel it', kind: 'num' },
  { n: 100, dec: 0, unit: '%', label: 'Presence', sub: 'Clinically undistracted', kind: 'num' },
];

// Copy and colours are props rather than constants, as the handoff asks.
export const KLODS_DEFAULTS = {
  theme: 'Light',
  brickTone: 'Clay',
  spotlight: '#ecd7ad',
  productName: 'The Brick',
  price: '€249',
  tagline: 'Presence, reimagined.',
  kicker: 'Do less. Weigh more.',
};
