// The three approved frame themes, from the design handoff in "UI/Fra claude
// design/Frames/ornate frames 3". They were picked out of six metals, which
// were themselves one weight of an earlier set of seven — the rest are gone.
//
// A theme is three things that have to agree: the ornament's palette (drawn on
// a canvas, below), the chrome and the vignette (CSS, see the [data-frame]
// blocks in globals.css), and the sack's art (tinted PNGs, sackArt below).

export const FRAMES = [
  { id: '14b', name: 'Dæmpet messing', note: 'Gyldent metal, vinrød ædelsten' },
  { id: '14c', name: 'Kobber / rosa', note: 'Varmt kobber, blågrøn ædelsten' },
  { id: '14f', name: 'Gunmetal + kobber', note: 'Køligt stål, kobber-ædelsten' },
];

export const DEFAULT_FRAME = '14b';

// hi/base/mid/dark/deep light→dark, plus the gem the corner bosses carry. mid
// and deep are also the vignette's two colours, which is why they appear again
// as --metal-mid and --metal-deep in globals.css: the ornament is painted in
// JS and the vignette is a gradient. Change one, change the other.
const PALETTES = {
  '14b': { hi: '#e4d3a6', base: '#b6a262', mid: '#8f7d42', dark: '#63552a', deep: '#41381a', gem: '#7a3b52' },
  '14c': { hi: '#f0cbb0', base: '#c98a6a', mid: '#a5654a', dark: '#733f2c', deep: '#4a2619', gem: '#3a6a7a' },
  '14f': { hi: '#cfd2d6', base: '#9aa0a6', mid: '#6e747b', dark: '#474d54', deep: '#2c3036', gem: '#a8683a' },
};

// The sack's five layers, tinted to match. The handoff calls these 16a/16b/16c
// against 14b/14c/14f — one each, so the frame's own id names the folder and
// there is nothing to keep in step. `shade` is shared: it's a dark copy of the
// body drawn over the coins, and it doesn't care what colour the sack is.
//
// The base differs because the app is served from a root and the lab is opened
// as a file next to it.
export const sackArt = (frame, base = '/sack/') => ({
  bg: `${base}${frame}/sack-bg.png`,
  bgB: `${base}${frame}/sack-bg-b.png`,
  ringBack: `${base}${frame}/ring-back.png`,
  fg: `${base}${frame}/sack-fg.png`,
  ringFront: `${base}${frame}/ring-front.png`,
  shade: `${base}shade.png`,
});

// One gold everywhere. The sacks are tinted; the coins are deliberately not —
// the handoff is explicit about it.
export const COIN_TONES = ['#fff6d6', '#ffe08a', '#f5be3c', '#c6871f', '#7e5212'];

// Lifted from the handoff's ornate(), with two changes. It hard-coded the
// window at (32,136,326,582) because the mock was always a 390x844 iPhone; ours
// moves with the device and its safe areas, so the rect is passed in — which is
// what the handoff says to do if the window isn't where it assumed. And the
// palette is looked up rather than baked in, because the three themes differ in
// nothing else.
export function drawOrnate(canvas, rect, frame) {
  const G = PALETTES[frame];
  if (!G) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (!W || !H) return;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const wx = rect.x, wy = rect.y, ww = rect.w, wh = rect.h;

  const ring = (x, y, w, h, t, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, t);
    ctx.fillRect(x, y + h - t, w, t);
    ctx.fillRect(x, y, t, h);
    ctx.fillRect(x + w - t, y, t, h);
  };

  // Nested beveled rings: light from the top left, dark to the bottom right.
  ring(wx - 12, wy - 12, ww + 24, wh + 24, 4, G.deep);
  ring(wx - 8, wy - 8, ww + 16, wh + 16, 5, G.base);
  ctx.fillStyle = G.hi;
  ctx.fillRect(wx - 8, wy - 8, ww + 16, 2);
  ctx.fillRect(wx - 8, wy - 8, 2, wh + 16);
  ctx.fillStyle = G.dark;
  ctx.fillRect(wx - 8, wy + wh + 6, ww + 16, 2);
  ctx.fillRect(wx + ww + 6, wy - 8, 2, wh + 16);
  ring(wx - 3, wy - 3, ww + 6, wh + 6, 3, G.mid);

  // Corner bosses, each with a gem and a glint. No studs and no crest: this is
  // the slim weight, and the handoff says not to thicken it.
  const bs = 10, gs = 4;
  const corners = [
    [wx - 8, wy - 8], [wx + ww + 8, wy - 8],
    [wx - 8, wy + wh + 8], [wx + ww + 8, wy + wh + 8],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = G.deep;
    ctx.fillRect(cx - bs, cy - bs, bs * 2, bs * 2);
    ctx.fillStyle = G.base;
    ctx.fillRect(cx - bs + 2, cy - bs + 2, bs * 2 - 4, bs * 2 - 4);
    ctx.fillStyle = G.hi;
    ctx.fillRect(cx - bs + 2, cy - bs + 2, bs * 2 - 4, 2);
    ctx.fillRect(cx - bs + 2, cy - bs + 2, 2, bs * 2 - 4);
    ctx.fillStyle = G.dark;
    ctx.fillRect(cx - bs + 2, cy + bs - 4, bs * 2 - 4, 2);
    ctx.fillRect(cx + bs - 4, cy - bs + 2, 2, bs * 2 - 4);
    ctx.fillStyle = G.gem;
    ctx.fillRect(cx - gs, cy - gs, gs * 2, gs * 2);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.55;
    ctx.fillRect(cx - gs + 1, cy - gs + 1, 3, 3);
    ctx.globalAlpha = 1;
  }
}
