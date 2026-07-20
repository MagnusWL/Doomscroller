# Handoff: Cranium coin bag (crowned-skull coin counter)

## Overview
A self-contained **coin counter widget**: pixel-gold coins drop with real 2D
physics into a **crowned skull's open cranium** — they tumble, clump, settle,
twinkle, and clink. Buying something lifts the top coins out with a pixel
"ka-ching". No UI, no scrolling, no game logic — the game calls `addCoin()`
when the player picks a coin up, and the skull does the rest.

**Try it first:** double-click `example.html`. It runs with no server and no
build, sound included. If something is wrong with the package, you will see it
there rather than inside your game.

## Fidelity
**High.** The art in `assets/skull/` is pre-baked to the client's approved
recipe (pixel-lab, 20 July 2026) and the engine options in `example.html` are
that recipe verbatim. Reuse the `options()` block as-is; change only what the
client asks changed.

## The approved configuration

```js
new CoinSack(canvas, {
  style: 'artsack',
  geometry: 'skull',            // the cranium's measured interior (see below)
  art: {
    bg: 'assets/skull/back.png',   // cavity, behind the coins
    fg: 'assets/skull/skull.png',  // face + crown, in front of the coins
  },
  coinTones: ['#fff6d6', '#ffe08a', '#f5be3c', '#c6871f', '#7e5212'],
  pixelate: true,
  pixelSize: 2.2,               // coin block = 3.18 buffer px
  fillCount: 30,                // the cranium visually holds 30
  groundShadow: false,          // the soft ellipse under it: removed, per client
  coinSamples: [...],           // 14 wavs — see Sound below
  flipSample: 'assets/coin-flip.mp3',
  spendStyle: 1,
  onCount: n => { /* the number is yours to render */ },
  onFull: () => { /* fires once when it brims — reward hook */ },
  soundOn: true,
  tempo: 0.85, glintStyle: 'star', soundStyle: 'classic',
  restitution: 0.42, friction: 0.58, gravity: 1.5,
  bodyScale: 0.72, spin: 0.5, density: 0.006,
})
```

## The canvas box is part of the design

```css
canvas { width: 560px; height: 380px; }
```

The skull was designed in **560×380 landscape** and the engine scales the art
by the canvas **height** (the crown would poke out of a width fit). The sides
are deliberately wide: coins spilling past the brim stay visible falling beside
the skull before they are culled (`sideRevealR` in the geometry). Scale the box
proportionally if you must, but keep the ratio; at 2.2 the buffer is 254×172,
so keep the displayed size at or above ~254 px wide or the pixel look is
scaled away.

## API

```js
sack.addCoin()      // one coin in. Call once per coin the player picks up.
sack.spendCoins(n)  // top n coins fly out + ka-ching. Returns how many it
                    // actually lifted (max what is visible) — the PRICE is
                    // your arithmetic, not the skull's.
sack.reset()        // clear, count to 0
sack.destroy()      // stop the loop, free the physics. Call on unmount.
sack._resize()      // call if the canvas box changes size
```

**The skull is a picture; the number is the balance.** It shows at most 30
coins — extras shove past the brim and are culled while your count keeps
going. Keep the real balance in the game and never ask the skull for it.

**Physics is self-tuning:** settled coins sleep (zero cost). One landing coin
wakes the pile for ~1 second, then everything sleeps again — measured, not
assumed. Above 64 live coins the engine culls sleeping ones. If you ever grant
many coins at once, spread the `addCoin()` calls over time: 20 dropped in one
tick shoved 9 over the brim in testing; dripped at 350 ms they all stayed.

## Sound — three layers, and one hard rule

- **Spawn:** `coin-flip.mp3` at one of four random playback rates.
- **Landing:** synth clink + one of 14 real coin clips (random which, never whether).
- **Spend:** pixel ka-ching (`spendStyle` 1–4, 1 is the approved one).

**The hard rule:** browsers refuse audio until the page has been touched, and
the engine builds its AudioContext once — at construction, before any touch
exists. Without the wake pattern the skull is silent and nothing says why:

```js
function wake() {
  sack._ensureAudio();
  if (sack.audio && sack.audio.state !== 'running') sack.audio.resume();
}
['pointerdown', 'touchend', 'keydown'].forEach(e =>
  window.addEventListener(e, wake, { passive: true }));
```

If the game has a start screen, that click is the gesture — call `wake()`
there. Scrolling and mouse wheels do **not** count.

**Serve the sounds over http.** The engine `fetch()`es them; `fetch()` against
`file://` is blocked in a normal browser and the engine swallows the failure
silently. `sounds-inline.js` (the same clips as `data:` URIs) exists only so
`example.html` works by double-click — point at `assets/coin/*.wav` and
`assets/coin-flip.mp3` in the game and do not ship the inline file.

## Assets

`assets/skull/back.png` and `skull.png` are **pre-baked**: 160×160, hue kept,
lightness locked to 8 steps, hard alpha — 19 KB total, down from 1.5 MB. The
engine's nearest-neighbour upscale does the rest. The unbaked 1254×1254
originals live in the Doomscroller repo under `coin-sack-kit/assets/skull/`
(and the pixel-lab there re-tunes and re-bakes if the client wants new
numbers).

The ground shadow you may see in older screenshots was **engine-drawn**, not
art. It is off by option here (`groundShadow: false`); no PNG was edited to
remove it.

## Files

- `coin-sack-engine.js` — the engine, ES module (`import { CoinSack } ...`)
- `coin-sack-engine.global.js` — same engine for `<script>` tags (`window.CoinSack`)
- `assets/skull/` — the baked art, two layers
- `assets/coin/coin-1..14.wav`, `assets/coin-flip.mp3` — the sounds
- `sounds-inline.js` — example-only fallback, see Sound
- `example.html` — the approved config, running

## Dependencies

**Matter.js 0.19.x** as `window.Matter`, loaded before the engine — CDN or
npm, the engine only looks it up. Nothing else, no build step.

## Provenance

Engine: Doomscroller `coin-sack-kit` (geometry-parameterised revision, July
2026). Skull design: "Crowned Skull Coins", Claude Design export. Recipe:
Nicolai in pixel-lab, 20 July 2026. This folder is a **copy taken to travel**
— fixes here do not flow back to the Doomscroller repo by themselves, nor the
reverse.
