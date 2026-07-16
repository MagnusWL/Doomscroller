// The seven frame styles from the design handoff in "UI/Fra claude design/
// Frames". Everything but the two gold ones is CSS — see the [data-frame]
// blocks in globals.css. This holds the list, and the ornament the gold ones
// draw.

export const FRAMES = [
  { id: '11c', group: 'Minimal', name: 'Glas', note: 'Matterede, blurrede bjælker' },
  { id: '11f', group: 'Minimal', name: 'Varm blæk', note: 'Varm næsten-sort, guld-hårlinje' },
  { id: '12a', group: 'Pixel', name: 'Glas + søm', note: 'Pixel-linjer og hjørne-pixels' },
  { id: '12b', group: 'Pixel', name: 'Varm + guldkant', note: 'Pixel-syet guldramme om vinduet' },
  { id: '12c', group: 'Pixel', name: 'Varm glas + flise', note: 'Flise-søm og hjørne-pixels' },
  { id: '13a', group: 'Guld', name: 'Rig', note: 'Bosser, ædelsten, krone og nagler' },
  { id: '13b', group: 'Guld', name: 'Let', note: 'Kun hjørne-bosser — mere plads' },
];

export const DEFAULT_FRAME = '11c';

// The two that need a canvas rather than CSS.
export const isOrnate = id => id === '13a' || id === '13b';

const GOLD = { hi: '#ffe9a8', base: '#f0b23c', mid: '#c6871f', dark: '#8a5a15', deep: '#5e3d0e' };
const GEM = '#b0304a';

// Lifted from the handoff's ornate(), with one change: it hard-coded the window
// at (32,136,326,582) because the mock was always a 390x844 iPhone. Ours moves
// with the device and its safe areas, so the rect is passed in — which is what
// the handoff says to do if the window isn't where it assumed.
export function drawOrnate(canvas, rect, heavy) {
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
  ring(wx - 12, wy - 12, ww + 24, wh + 24, 4, GOLD.deep);
  ring(wx - 8, wy - 8, ww + 16, wh + 16, 5, GOLD.base);
  ctx.fillStyle = GOLD.hi;
  ctx.fillRect(wx - 8, wy - 8, ww + 16, 2);
  ctx.fillRect(wx - 8, wy - 8, 2, wh + 16);
  ctx.fillStyle = GOLD.dark;
  ctx.fillRect(wx - 8, wy + wh + 6, ww + 16, 2);
  ctx.fillRect(wx + ww + 6, wy - 8, 2, wh + 16);
  ring(wx - 3, wy - 3, ww + 6, wh + 6, 3, GOLD.mid);

  // Studs along the top and bottom.
  if (heavy) {
    for (let x = wx + 20; x < wx + ww - 10; x += 44) {
      for (const yy of [wy - 10, wy + wh + 4]) {
        ctx.fillStyle = GOLD.base;
        ctx.fillRect(x, yy, 6, 6);
        ctx.fillStyle = GOLD.hi;
        ctx.fillRect(x, yy, 2, 2);
      }
    }
  }

  // Corner bosses, each with a gem and a glint.
  const bs = heavy ? 13 : 10;
  const gs = heavy ? 6 : 4;
  const corners = [
    [wx - 8, wy - 8], [wx + ww + 8, wy - 8],
    [wx - 8, wy + wh + 8], [wx + ww + 8, wy + wh + 8],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = GOLD.deep;
    ctx.fillRect(cx - bs, cy - bs, bs * 2, bs * 2);
    ctx.fillStyle = GOLD.base;
    ctx.fillRect(cx - bs + 2, cy - bs + 2, bs * 2 - 4, bs * 2 - 4);
    ctx.fillStyle = GOLD.hi;
    ctx.fillRect(cx - bs + 2, cy - bs + 2, bs * 2 - 4, 2);
    ctx.fillRect(cx - bs + 2, cy - bs + 2, 2, bs * 2 - 4);
    ctx.fillStyle = GOLD.dark;
    ctx.fillRect(cx - bs + 2, cy + bs - 4, bs * 2 - 4, 2);
    ctx.fillRect(cx + bs - 4, cy - bs + 2, 2, bs * 2 - 4);
    ctx.fillStyle = GEM;
    ctx.fillRect(cx - gs, cy - gs, gs * 2, gs * 2);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(cx - gs + 1, cy - gs + 1, Math.max(2, gs - 1), Math.max(2, gs - 1));
    ctx.globalAlpha = 1;
  }

  // The crest above the window.
  if (heavy) {
    const mx = wx + ww / 2;
    ctx.fillStyle = GOLD.base;
    ctx.fillRect(mx - 24, wy - 22, 48, 10);
    ctx.fillRect(mx - 24, wy - 30, 8, 10);
    ctx.fillRect(mx - 4, wy - 32, 8, 12);
    ctx.fillRect(mx + 16, wy - 30, 8, 10);
    ctx.fillStyle = GOLD.hi;
    ctx.fillRect(mx - 24, wy - 22, 48, 2);
    ctx.fillStyle = GEM;
    ctx.fillRect(mx - 5, wy - 24, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(mx - 4, wy - 23, 3, 3);
    ctx.globalAlpha = 1;
  }
}
