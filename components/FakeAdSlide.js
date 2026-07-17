'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Easing, interpolate, R, bell, hexA, clamp,
  THEMES, TONES, WORN, WORN_SZ, SPECS, SCENES, TOTAL_DUR, sceneAt,
  STAGE_W, STAGE_H, KLODS_DEFAULTS,
} from '@/lib/klods';
import { priceFor } from '@/lib/pricing';
import AdPriceButton from '@/components/AdPriceButton';

// Loaded in app/layout.js via next/font, which self-hosts them.
const FSANS = 'var(--font-archivo), system-ui, sans-serif';
const FSERIF = 'var(--font-cormorant), Georgia, serif';
const FMONO = 'var(--font-space-mono), ui-monospace, monospace';

const ConfigCtx = createContext(KLODS_DEFAULTS);
const useCfg = () => useContext(ConfigCtx);

// ── the brick: a real CSS 3-D cuboid, so it can turn and catch light ────────
function Brick3D({ rotX = -17, rotY = 30, scale = 1, lift = 0, glow = 1, glowColor = '#ecd7ad', tone = 'Clay' }) {
  const T = TONES[tone] || TONES.Clay;
  const L = 460, H = 172, D = 208;
  const { pal } = useCfg();

  const faceBase = { position: 'absolute', left: '50%', top: '50%' };
  const mkFace = (w, h, tf, bg) => ({
    ...faceBase, width: w, height: h, borderRadius: 10,
    transform: `translate(-50%,-50%) ${tf}`,
    backgroundImage: WORN.concat(bg).join(', '),
    backgroundSize: WORN_SZ.concat('100% 100%').join(', '),
    boxShadow: 'inset 0 0 70px rgba(0,0,0,0.34), inset 0 2px 1px rgba(255,255,255,0.05)',
  });

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', perspective: '1750px' }}>
      <div style={{
        position: 'absolute', width: 900, height: 900, borderRadius: '50%',
        background: `radial-gradient(circle, ${hexA(glowColor, 0.5 * glow * pal.bloomK)} 0%, ${hexA(glowColor, 0.16 * glow * pal.bloomK)} 34%, ${hexA(glowColor, 0)} 66%)`,
        transform: `translateY(${lift}px)`, filter: 'blur(6px)', mixBlendMode: pal.glowBlend,
      }} />
      <div style={{
        position: 'absolute', width: L * scale * 1.25, height: 78 * scale, borderRadius: '50%',
        background: `radial-gradient(ellipse, rgba(0,0,0,${pal.shadowA}) 0%, rgba(0,0,0,0) 70%)`,
        transform: `translateY(${lift + H * scale * 0.66}px)`, filter: 'blur(7px)',
      }} />
      <div style={{
        position: 'relative', width: L, height: H, transformStyle: 'preserve-3d',
        transform: `translateY(${lift}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
      }}>
        <div style={mkFace(L, H, 'translateZ(104px)', T.front)} />
        <div style={mkFace(L, H, 'rotateY(180deg) translateZ(104px)', T.side)} />
        <div style={mkFace(D, H, 'rotateY(90deg) translateZ(230px)', T.side)} />
        <div style={mkFace(D, H, 'rotateY(-90deg) translateZ(230px)', T.side)} />
        <div style={mkFace(L, D, 'rotateX(90deg) translateZ(86px)', T.top)} />
        <div style={mkFace(L, D, 'rotateX(-90deg) translateZ(86px)', T.bottom)} />
        <div style={{
          ...faceBase, width: L, height: H, borderRadius: 10,
          transform: 'translate(-50%,-50%) translateZ(105px)',
          background: `linear-gradient(200deg, ${hexA(glowColor, 0.22 * glow)} 0%, transparent 42%)`,
        }} />
      </div>
    </div>
  );
}

// A static shot of the brick alone, for the inventory: replaying the full
// six-scene story in a grid cell (or even the fullscreen viewer) is a lot of
// motion for "here's the ad you bought" to earn. Needs its own ConfigCtx
// provider since Brick3D isn't otherwise usable outside FakeAdSlide's tree.
export function BrickThumbnail({ config }) {
  const cfg = { ...KLODS_DEFAULTS, ...config };
  const pal = THEMES[cfg.theme] || THEMES.Light;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: pal.bg }}>
      <ConfigCtx.Provider value={{ ...cfg, pal }}>
        <Brick3D glowColor={cfg.spotlight} tone={cfg.brickTone} />
      </ConfigCtx.Provider>
    </div>
  );
}

function Dust({ localTime = 0, spot = '#ecd7ad', n = 18 }) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const y = 1620 - ((localTime * (16 + (i % 5) * 6) + i * 150) % 1750);
    const x = 540 + Math.sin(i * 2.17) * (90 + (i % 5) * 78) + Math.sin(localTime * 0.35 + i) * 22;
    const size = 2 + (i % 3);
    const op = (0.06 + 0.09 * (Math.sin(localTime * 0.7 + i * 1.3) * 0.5 + 0.5))
      * clamp((1750 - Math.abs(y - 760)) / 900, 0, 1);
    items.push(
      <div key={i} style={{
        position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
        background: spot, opacity: op, filter: 'blur(0.5px)',
      }} />
    );
  }
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{items}</div>;
}

function Vignette() {
  const { pal } = useCfg();
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: pal.vignette }} />;
}

function SceneBox({ children }) {
  const { pal } = useCfg();
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: pal.bg }}>{children}</div>;
}

// ── 1 · Open (1.8s) ────────────────────────────────────────────────────────
function Open({ progress: p, localTime: lt }) {
  const cfg = useCfg();
  const { pal } = cfg;
  const gR = interpolate([0, 1], [420, 1180], Easing.easeOutCubic)(p);
  const gO = interpolate([0, 0.55, 1], [0, 0.85, 0.8])(p);
  const tO = interpolate([0, 0.2, 0.42, 0.82, 1], [0, 0, 1, 1, 0])(p);
  const tY = (1 - Easing.easeOutCubic(R(p, 0.12, 0.44))) * 20;
  return (
    <SceneBox>
      <div style={{
        position: 'absolute', left: '50%', top: '44%', width: gR, height: gR,
        transform: 'translate(-50%,-50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${hexA(cfg.spotlight, 0.5 * gO * pal.spotA)} 0%, ${hexA(cfg.spotlight, 0.14 * gO * pal.spotA)} 40%, transparent 68%)`,
        mixBlendMode: pal.glowBlend,
      }} />
      <Dust localTime={lt} spot={cfg.spotlight} />
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '60%', textAlign: 'center',
        opacity: tO, transform: `translateY(${tY}px)`, padding: '0 90px',
      }}>
        <div style={{
          fontFamily: FSERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 58,
          color: pal.ink, letterSpacing: '0.01em', lineHeight: 1.25,
        }}>
          Introducing a new kind of presence.
        </div>
      </div>
      <Vignette />
    </SceneBox>
  );
}

// ── 2 · Reveal (3.0s) — the hero shot: rise, overshoot, glint, flash ───────
function Reveal({ progress: p, localTime: lt }) {
  const cfg = useCfg();
  const { pal } = cfg;
  const lift = interpolate([0, 0.42], [1200, 0], Easing.easeOutExpo)(p);
  const rotY = interpolate([0, 0.6], [48, 28], Easing.easeOutCubic)(p) + Math.sin(lt * 0.6) * 1.1;
  const rotX = -16 + Math.sin(lt * 0.5) * 0.9;
  const scale = interpolate([0, 0.44, 1], [0.95, 1.22, 1.18], Easing.easeOutCubic)(p);
  const glow = interpolate([0, 0.42], [0.2, 1])(p);
  const sweep = R(p, 0.42, 0.74), sop = bell(R(p, 0.44, 0.74));
  const flash = bell(R(p, 0.34, 0.56)) * 0.4;
  return (
    <SceneBox>
      <Dust localTime={lt} spot={cfg.spotlight} />
      <Brick3D rotX={rotX} rotY={rotY} scale={scale} lift={lift} glow={glow} glowColor={cfg.spotlight} tone={cfg.brickTone} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '26%', height: '48%', width: '20%', left: `${-25 + sweep * 128}%`,
          background: 'linear-gradient(105deg, transparent, rgba(255,247,232,0.4), transparent)',
          transform: 'skewX(-13deg)', filter: 'blur(7px)', opacity: sop,
        }} />
      </div>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 46%, ${hexA(cfg.spotlight, flash * pal.spotA)} 0%, transparent 55%)`,
        mixBlendMode: pal.glowBlend,
      }} />
      <Vignette />
    </SceneBox>
  );
}

// ── 3 · Name (2.4s) ────────────────────────────────────────────────────────
function Name({ progress: p, localTime: lt }) {
  const cfg = useCfg();
  const { pal } = cfg;
  const e = Easing.easeInOutCubic(R(p, 0, 0.5));
  const lift = interpolate([0, 1], [0, -320])(e);
  const scale = interpolate([0, 1], [1.18, 0.86])(e);
  const rotY = 28 + Math.sin(lt * 0.45) * 1.4;
  const rotX = -17 + Math.sin(lt * 0.35) * 0.8;
  const wmO = R(p, 0.06, 0.3);
  const nO = R(p, 0.24, 0.52), nY = (1 - Easing.easeOutCubic(R(p, 0.24, 0.56))) * 34;
  return (
    <SceneBox>
      <Brick3D rotX={rotX} rotY={rotY} scale={scale} lift={lift} glow={1} glowColor={cfg.spotlight} tone={cfg.brickTone} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '62%', textAlign: 'center' }}>
        <div style={{
          fontFamily: FMONO, fontSize: 25, letterSpacing: '0.62em', color: pal.mut,
          opacity: wmO, marginBottom: 34, paddingLeft: '0.62em',
        }}>
          K L O D S
        </div>
        <div style={{
          fontFamily: FSANS, fontWeight: 300, fontSize: 138, color: pal.ink,
          letterSpacing: '-0.02em', lineHeight: 1, opacity: nO, transform: `translateY(${nY}px)`,
        }}>
          {cfg.productName}
        </div>
      </div>
      <Vignette />
    </SceneBox>
  );
}

// ── 4 · Specs (5.4s) — rows stagger in, numbers count up ───────────────────
function Specs({ progress: p, localTime: lt }) {
  const cfg = useCfg();
  const { pal } = cfg;
  const rotY = 30 + Math.sin(lt * 0.45) * 1.6;
  const rotX = -17 + Math.sin(lt * 0.32) * 0.7;
  const hO = R(p, 0.02, 0.16);
  return (
    <SceneBox>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '46%' }}>
        <Brick3D rotX={rotX} rotY={rotY} scale={0.7} lift={40} glow={0.9} glowColor={cfg.spotlight} tone={cfg.brickTone} />
      </div>
      <div style={{ position: 'absolute', left: 90, right: 90, top: '47%', textAlign: 'center' }}>
        <div style={{
          fontFamily: FMONO, fontSize: 23, letterSpacing: '0.42em', color: pal.dim,
          opacity: hO, paddingLeft: '0.42em',
        }}>
          TECHNICAL&nbsp;SPECIFICATIONS
        </div>
        <div style={{ marginTop: 40 }}>
          {SPECS.map((s, i) => {
            const t0 = 0.1 + i * 0.13;
            const rp = R(p, t0, t0 + 0.22);
            const ce = R(p, t0, t0 + 0.32);
            const val = s.kind === 'num' ? (s.n * ce).toFixed(s.dec) + s.unit : s.disp;
            return (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 34, padding: '26px 8px',
                borderTop: i === 0 ? 'none' : `1px solid rgba(${pal.hairRGB}, ${0.22 * rp})`,
                opacity: rp, transform: `translateY(${(1 - Easing.easeOutCubic(rp)) * 26}px)`,
              }}>
                <div style={{
                  fontFamily: FSANS, fontWeight: 300, fontSize: 96, color: pal.ink,
                  lineHeight: 0.9, minWidth: 240, textAlign: 'right', letterSpacing: '-0.02em',
                }}>
                  {val}
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontFamily: FMONO, fontSize: 26, letterSpacing: '0.14em', color: pal.ink, textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: FSERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 34, color: pal.mut, marginTop: 4 }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Vignette />
    </SceneBox>
  );
}

// ── 5 · Tagline (2.8s) ─────────────────────────────────────────────────────
function Tagline({ progress: p, localTime: lt }) {
  const cfg = useCfg();
  const { pal } = cfg;
  const gO = interpolate([0, 0.4, 1], [0.4, 0.7, 0.7])(p);
  const tO = R(p, 0.05, 0.34);
  const tS = interpolate([0, 0.6], [1.07, 1], Easing.easeOutCubic)(p);
  const kO = R(p, 0.46, 0.72), kY = (1 - Easing.easeOutCubic(R(p, 0.46, 0.78))) * 16;
  const drift = Math.sin(lt * 0.3) * 5;
  return (
    <SceneBox>
      <div style={{
        position: 'absolute', left: '50%', top: '46%', width: 1300, height: 1300,
        transform: 'translate(-50%,-50%)', borderRadius: '50%', mixBlendMode: pal.glowBlend,
        background: `radial-gradient(circle, ${hexA(cfg.spotlight, 0.16 * gO * pal.spotA)} 0%, transparent 60%)`,
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%',
        transform: `translateY(-50%) translateY(${drift}px)`, textAlign: 'center', padding: '0 80px',
      }}>
        <div style={{
          fontFamily: FSERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 118, color: pal.ink,
          lineHeight: 1.06, letterSpacing: '0.005em', opacity: tO, transform: `scale(${tS})`,
        }}>
          {cfg.tagline}
        </div>
        <div style={{ width: 76, height: 1, background: `rgba(${pal.hairRGB},0.16)`, margin: '54px auto', opacity: kO }} />
        <div style={{
          fontFamily: FSANS, fontWeight: 500, fontSize: 34, color: pal.mut, letterSpacing: '0.34em',
          textTransform: 'uppercase', opacity: kO, transform: `translateY(${kY}px)`, paddingLeft: '0.34em',
        }}>
          {cfg.kicker}
        </div>
      </div>
      <Vignette />
    </SceneBox>
  );
}

// ── 6 · Price / CTA (3.4s) ─────────────────────────────────────────────────
function Price({ progress: p, localTime: lt }) {
  const cfg = useCfg();
  const { pal } = cfg;
  const rotY = 30 + Math.sin(lt * 0.42) * 1.4;
  const rotX = -17 + Math.sin(lt * 0.33) * 0.8;
  const wmO = R(p, 0.08, 0.32);
  const pO = R(p, 0.24, 0.5), pY = (1 - Easing.easeOutCubic(R(p, 0.24, 0.54))) * 26;
  const sO = R(p, 0.44, 0.68);
  const lO = R(p, 0.62, 0.86);
  return (
    <SceneBox>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%' }}>
        <Brick3D rotX={rotX} rotY={rotY} scale={0.66} lift={70} glow={0.95} glowColor={cfg.spotlight} tone={cfg.brickTone} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '48%', textAlign: 'center', padding: '0 80px' }}>
        <div style={{ fontFamily: FMONO, fontSize: 27, letterSpacing: '0.66em', color: pal.ink, opacity: wmO, paddingLeft: '0.66em' }}>
          K L O D S
        </div>
        <div style={{ opacity: pO, transform: `translateY(${pY}px)`, marginTop: 44 }}>
          <div style={{ fontFamily: FSERIF, fontStyle: 'italic', fontWeight: 300, fontSize: 62, color: pal.mut }}>
            {cfg.productName}
          </div>
          <div style={{ fontFamily: FSANS, fontWeight: 300, fontSize: 132, color: pal.ink, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 6 }}>
            {cfg.price}
          </div>
        </div>
        <div style={{ fontFamily: FMONO, fontSize: 27, letterSpacing: '0.12em', color: pal.mut, opacity: sO, marginTop: 46 }}>
          Handmade in Denmark&nbsp;&nbsp;·&nbsp;&nbsp;Ships in 6–8 weeks
        </div>
        <div style={{ fontFamily: FMONO, fontSize: 19, letterSpacing: '0.08em', color: pal.dim, opacity: lO, marginTop: 22 }}>
          Brick may vary. Presence not guaranteed.
        </div>
      </div>
      <Vignette />
    </SceneBox>
  );
}

const SCENE_COMPONENTS = { Open, Reveal, Name, Specs, Tagline, Price };

// ── the slide ──────────────────────────────────────────────────────────────
export default function FakeAdSlide({ feedRef, config, slideId, onFilled, coins, onBuyAd, buying }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);

  const cfg = { ...KLODS_DEFAULTS, ...config };
  const pal = THEMES[cfg.theme] || THEMES.Light;
  const price = priceFor(slideId);

  // Unlike a video ad this needs no async fetch — the whole thing renders on
  // the spot — so it's "loaded" the instant it mounts. Runs once; there's
  // nothing here that ever changes what counts as filled.
  const onFilledRef = useRef(onFilled);
  onFilledRef.current = onFilled;
  useEffect(() => {
    onFilledRef.current?.();
  }, []);

  // The piece is authored at a fixed 1080×1920 and stays 9:16 everywhere, like
  // a Short: fit it to the slide and let the feed fill the sides.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fit = () => {
      const r = root.getBoundingClientRect();
      if (r.width && r.height) setScale(Math.min(r.width / STAGE_W, r.height / STAGE_H));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Only the slide on screen animates. Every fake ad running at once would
  // burn a phone's battery on frames nobody is looking at, and the piece is
  // a story — it should start at its first beat when it's scrolled to, not
  // resume halfway through the specs.
  useEffect(() => {
    const feed = feedRef.current;
    const root = rootRef.current;
    if (!feed || !root) return;
    const observer = new IntersectionObserver(
      entries => setRunning(entries[0].isIntersecting),
      { root: feed, threshold: 0.6 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [feedRef]);

  useEffect(() => {
    if (!running) return;
    let frame;
    let startedAt = null;
    const tick = now => {
      if (startedAt === null) startedAt = now;
      setTime(((now - startedAt) / 1000) % TOTAL_DUR);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const { index, progress, localTime } = sceneAt(time);
  const Scene = SCENE_COMPONENTS[SCENES[index].name];

  return (
    <div className="fake-ad" ref={rootRef} style={{ background: pal.bg }}>
      <div
        className="fake-ad-stage"
        ref={stageRef}
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <ConfigCtx.Provider value={{ ...cfg, pal }}>
          <Scene progress={progress} localTime={localTime} />
        </ConfigCtx.Provider>
      </div>
      <AdPriceButton
        slideId={slideId}
        price={price}
        coins={coins}
        onBuy={e => {
          e.stopPropagation();
          onBuyAd(slideId, price);
        }}
        disabled={buying}
      />
    </div>
  );
}
