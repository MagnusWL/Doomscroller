// ── KOPI — ret ikke noget her ───────────────────────────────────────────────
// Originalen er lib/frames.js, med `export` fjernet, det hele pakket ind i en
// funktion, og de fem ting samlet på window.Frames i bunden.
// Se coin-sack-engine.js for hvorfor indpakningen skal være der.
(function () {
// The frame styles from the design handoffs in "UI/Fra claude design/Frames".
// Everything but the ornate ones is CSS — see the [data-frame] blocks in
// globals.css. This holds the list, and the ornament the ornate ones draw.

const FRAMES = [
  { id: '11c', group: 'Minimal', name: 'Glas', note: 'Matterede, blurrede bjælker' },
  { id: '11f', group: 'Minimal', name: 'Varm blæk', note: 'Varm næsten-sort, guld-hårlinje' },
  { id: '12a', group: 'Pixel', name: 'Glas + søm', note: 'Pixel-linjer og hjørne-pixels' },
  { id: '12b', group: 'Pixel', name: 'Varm + guldkant', note: 'Pixel-syet guldramme om vinduet' },
  { id: '12c', group: 'Pixel', name: 'Varm glas + flise', note: 'Flise-søm og hjørne-pixels' },
  { id: '13a', group: 'Guld', name: 'Rig', note: 'Bosser, ædelsten, krone og nagler' },
  { id: '13b', group: 'Guld', name: 'Let', note: 'Kun hjørne-bosser — mere plads' },
  // design_handoff_ornate_frame: 13b's frame, six muted metals, each with a
  // vignette behind the ad in the same nuance.
  { id: '14a', group: 'Metal', name: 'Antik bronze', note: 'Brunt metal, grøn ædelsten' },
  { id: '14b', group: 'Metal', name: 'Dæmpet messing', note: 'Gulligt metal, vinrød ædelsten' },
  { id: '14c', group: 'Metal', name: 'Kobber / rosa', note: 'Varmt kobber, blågrøn ædelsten' },
  { id: '14d', group: 'Metal', name: 'Sølv / tin', note: 'Køligt sølv, blå ædelsten' },
  { id: '14e', group: 'Metal', name: 'Mørk antikguld', note: 'Mørkt guld, bordeaux ædelsten' },
  { id: '14f', group: 'Metal', name: 'Gunmetal + kobber', note: 'Gråt stål, kobber-ædelsten' },
];

const DEFAULT_FRAME = '11c';

// The picker's headings, in the order the frames are listed. Derived, so a new
// frame only ever has to be added to FRAMES above.
const GROUPS = [...new Set(FRAMES.map(f => f.group))];

// The ornament's colours, and the only thing that separates the six metals from
// each other: their geometry is identical. 13a/13b are the original gold from
// the first handoff; 14a–14f come from design_handoff_ornate_frame.
//
// A frame is ornate exactly when it has an entry here — the ones that aren't
// are pure CSS and never touch a canvas.
const PALETTES = {
  '13a': { hi: '#ffe9a8', base: '#f0b23c', mid: '#c6871f', dark: '#8a5a15', deep: '#5e3d0e', gem: '#b0304a' },
  '13b': { hi: '#ffe9a8', base: '#f0b23c', mid: '#c6871f', dark: '#8a5a15', deep: '#5e3d0e', gem: '#b0304a' },
  '14a': { hi: '#e8cf9a', base: '#b98f52', mid: '#8a6636', dark: '#5f4526', deep: '#3e2c17', gem: '#2f6f66' },
  '14b': { hi: '#e4d3a6', base: '#b6a262', mid: '#8f7d42', dark: '#63552a', deep: '#41381a', gem: '#7a3b52' },
  '14c': { hi: '#f0cbb0', base: '#c98a6a', mid: '#a5654a', dark: '#733f2c', deep: '#4a2619', gem: '#3a6a7a' },
  '14d': { hi: '#eef1f5', base: '#b9c0c9', mid: '#8b929c', dark: '#5c626b', deep: '#3a3e45', gem: '#3f5e86' },
  '14e': { hi: '#cbb277', base: '#9d8342', mid: '#77602c', dark: '#50411d', deep: '#332a13', gem: '#6a2f3a' },
  '14f': { hi: '#cfd2d6', base: '#9aa0a6', mid: '#6e747b', dark: '#474d54', deep: '#2c3036', gem: '#a8683a' },
};

const isOrnate = id => id in PALETTES;

// Lifted from the handoffs' ornate(), with two changes. They hard-coded the
// window at (32,136,326,582) because the mock was always a 390x844 iPhone; ours
// moves with the device and its safe areas, so the rect is passed in — which is
// what the handoff says to do if the window isn't where it assumed. And the
// palette is looked up rather than baked in, because the six metals differ in
// nothing else.
function drawOrnate(canvas, rect, frame) {
  const G = PALETTES[frame];
  if (!G) return;
  // Only 13a carries the studs and the crest. Everything else is the slim
  // weight the ornate handoff calls "do not thicken".
  const heavy = frame === '13a';

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

  // Studs along the top and bottom.
  if (heavy) {
    for (let x = wx + 20; x < wx + ww - 10; x += 44) {
      for (const yy of [wy - 10, wy + wh + 4]) {
        ctx.fillStyle = G.base;
        ctx.fillRect(x, yy, 6, 6);
        ctx.fillStyle = G.hi;
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
    ctx.globalAlpha = 0.6;
    ctx.fillRect(cx - gs + 1, cy - gs + 1, Math.max(2, gs - 1), Math.max(2, gs - 1));
    ctx.globalAlpha = 1;
  }

  // The crest above the window.
  if (heavy) {
    const mx = wx + ww / 2;
    ctx.fillStyle = G.base;
    ctx.fillRect(mx - 24, wy - 22, 48, 10);
    ctx.fillRect(mx - 24, wy - 30, 8, 10);
    ctx.fillRect(mx - 4, wy - 32, 8, 12);
    ctx.fillRect(mx + 16, wy - 30, 8, 10);
    ctx.fillStyle = G.hi;
    ctx.fillRect(mx - 24, wy - 22, 48, 2);
    ctx.fillStyle = G.gem;
    ctx.fillRect(mx - 5, wy - 24, 10, 10);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(mx - 4, wy - 23, 3, 3);
    ctx.globalAlpha = 1;
  }
}
window.Frames = { FRAMES, DEFAULT_FRAME, GROUPS, isOrnate, drawOrnate };
})();
