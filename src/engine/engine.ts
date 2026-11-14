import { rng, TAU, THOUGHT_FONT_FAMILY } from './math';
import type { Frame, Layout, Place, Point, Presence, Weather } from './types';

export interface EngineOptions {
  places: Place[];
  weathers: Weather[];
  presence: Presence;
  initialPlace: string;
  initialWeather: string;
  /** Where a released Thought starts its journey (just above the input panel). */
  releaseOrigin(layout: Layout): Point;
  /** A Thought finished its Ritual in this Place. */
  onRitualComplete(placeId: string): void;
}

export interface Engine {
  setPlace(id: string): void;
  setWeather(id: string): void;
  release(text: string): void;
  destroy(): void;
}

interface Star { x: number; y: number; s: number; p: number; f: number }
interface PeerStar { x: number; y: number; born: number; life: number; txt: string; ph: number }

/** Owns the canvas, the frame loop and everything engine-wide (stars, Weather, Presence stars). */
export function createEngine(canvas: HTMLCanvasElement, opts: EngineOptions): Engine {
  const c = canvas.getContext('2d')!;
  const byId = <T extends { id: string }>(list: T[], id: string): T => {
    const found = list.find((x) => x.id === id);
    if (!found) throw new Error('Unknown id: ' + id);
    return found;
  };

  let place = byId(opts.places, opts.initialPlace);
  let selectedWeather = opts.initialWeather;
  const intensity: Record<string, number> = {};
  // Start from a clear sky; the selected Weather fades in.
  for (const w of opts.weathers) intensity[w.id] = 0;

  const reducedMotion = !!window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let layout: Layout;
  let scenery: HTMLCanvasElement;
  let stars: Star[] = [];
  let peerStars: PeerStar[] = [];

  function computeLayout(): Layout {
    const W = window.innerWidth;
    const H = window.innerHeight;
    return {
      width: W,
      height: H,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      groundY: H * (W < 600 ? 0.66 : 0.72),
      horizonY: H * 0.48,
      unit: Math.max(38, Math.min(86, Math.min(W, H) * 0.085)),
      reducedMotion,
    };
  }

  function buildScenery() {
    scenery = document.createElement('canvas');
    scenery.width = Math.floor(layout.width * layout.dpr);
    scenery.height = Math.floor(layout.height * layout.dpr);
    const g = scenery.getContext('2d')!;
    g.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
    place.buildScenery(g, layout);
  }

  function buildStars() {
    const r = rng(21);
    stars = [];
    for (let i = 0; i < 90; i++) stars.push({ x: r() * layout.width, y: r() * layout.groundY * 0.62, s: 0.5 + r() * 1.1, p: r() * TAU, f: 0.6 + r() * 1.6 });
  }

  function initWeathers() {
    for (const w of opts.weathers) w.init(layout);
  }

  function resize() {
    layout = computeLayout();
    canvas.width = Math.floor(layout.width * layout.dpr);
    canvas.height = Math.floor(layout.height * layout.dpr);
    buildScenery();
    buildStars();
    initWeathers();
  }

  function addPeerStar(text: string) {
    const txt = text.replace(/\s+/g, ' ').trim().slice(0, 40);
    const top = Math.max(150, layout.height * 0.2);
    const bot = Math.max(top + 40, layout.groundY * 0.58);
    let tw = 0;
    if (txt) {
      c.font = '14px ' + THOUGHT_FONT_FAMILY;
      tw = c.measureText(txt).width;
    }
    let x = layout.width * (0.1 + Math.random() * 0.8);
    if (tw) x = Math.max(tw / 2 + 12, Math.min(layout.width - tw / 2 - 12, x));
    peerStars.push({ x, y: top + Math.random() * (bot - top), born: performance.now(), life: 10000, txt, ph: Math.random() * TAU });
    if (peerStars.length > 30) peerStars.shift();
  }

  function drawPeerStars(now: number) {
    for (let i = peerStars.length - 1; i >= 0; i--) {
      const st = peerStars[i];
      const age = now - st.born;
      if (age > st.life) { peerStars.splice(i, 1); continue; }
      const a = Math.min(1, age / 1500) * Math.min(1, (st.life - age) / 3000) * (0.75 + 0.25 * Math.sin(now * 0.004 + st.ph));
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(st.x, st.y, 0, st.x, st.y, 16);
      g.addColorStop(0, 'rgba(255,240,205,' + (0.9 * a).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = g; c.beginPath(); c.arc(st.x, st.y, 16, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,245,225,' + (0.7 * a).toFixed(3) + ')';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(st.x - 7, st.y); c.lineTo(st.x + 7, st.y); c.moveTo(st.x, st.y - 7); c.lineTo(st.x, st.y + 7); c.stroke();
      c.globalCompositeOperation = 'source-over';
      if (st.txt) {
        c.font = '14px ' + THOUGHT_FONT_FAMILY;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = 'rgba(241,230,211,' + (0.8 * a).toFixed(3) + ')';
        c.fillText(st.txt, st.x, st.y + 24);
      }
    }
  }

  let last = performance.now();
  let rafId = 0;
  function frame(now: number) {
    const dt = Math.min(48, now - last);
    last = now;
    const k = dt / 16.67;

    for (const w of opts.weathers) {
      const target = w.id === selectedWeather ? 1 : 0;
      intensity[w.id] += (target - intensity[w.id]) * 0.03 * k;
    }
    const f: Frame = { now, k, layout, weather: intensity };

    c.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(scenery, 0, 0, layout.width, layout.height);

    let dim = 0;
    for (const w of opts.weathers) dim += (w.starDimming ?? 0) * intensity[w.id];
    const starFade = Math.max(0, 1 - dim);
    for (const s of stars) {
      c.fillStyle = 'rgba(235,240,255,' + ((0.25 + 0.45 * (0.5 + 0.5 * Math.sin(now * 0.001 * s.f + s.p))) * starFade).toFixed(3) + ')';
      c.fillRect(s.x, s.y, s.s, s.s);
    }

    place.drawBack?.(c, f);
    c.globalCompositeOperation = 'source-over';
    for (const w of opts.weathers) w.draw(c, f, intensity[w.id], place);
    c.globalCompositeOperation = 'source-over';
    place.drawFront?.(c, f);
    c.globalCompositeOperation = 'source-over';
    drawPeerStars(now);

    const done = place.ritual.draw(c, f);
    for (let i = 0; i < done; i++) opts.onRitualComplete(place.id);

    rafId = requestAnimationFrame(frame);
  }

  resize();
  place.enter?.();
  window.addEventListener('resize', resize);
  const unsubscribe = opts.presence.onRelease(addPeerStar);
  rafId = requestAnimationFrame(frame);

  return {
    setPlace(id) {
      if (id === place.id) return;
      for (const p of opts.places) p.ritual.clear();
      place = byId(opts.places, id);
      place.enter?.();
      buildScenery();
      initWeathers();
    },
    setWeather(id) {
      byId(opts.weathers, id);
      selectedWeather = id;
    },
    release(text) {
      place.ritual.release(text, opts.releaseOrigin(layout), c, layout);
    },
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      unsubscribe();
      for (const p of opts.places) p.ritual.clear();
    },
  };
}
