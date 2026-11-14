import { audioUrl } from '../engine/audio';
import { rng, TAU } from '../engine/math';
import type { Frame, Layout, Place } from '../engine/types';
import { createBurnRitual } from '../rituals/burn';

interface Flame {
  x: number; y: number; vx: number; vy: number; l: number; d: number; s: number; ph: number;
}
interface Ember {
  x: number; y: number; vx: number; vy: number; l: number; d: number; s: number; ph: number;
}

function pine(g: CanvasRenderingContext2D, x: number, base: number, h: number, w: number, color: string) {
  g.fillStyle = color;
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const yTop = base - h * (1 - t0);
    const half = (w * (0.35 + (0.65 * (i + 1)) / tiers)) / 2;
    g.beginPath();
    g.moveTo(x, yTop);
    g.lineTo(x + half, base - h * (1 - (i + 1.5) / tiers));
    g.lineTo(x - half, base - h * (1 - (i + 1.5) / tiers));
    g.closePath();
    g.fill();
  }
  g.fillRect(x - w * 0.03, base - h * 0.05, w * 0.06, h * 0.08);
}

function fireColor(l: number): string {
  const g = Math.round(60 + 175 * Math.pow(l, 1.5));
  const b = l > 0.78 ? Math.round((l - 0.78) * 4.5 * 110) : 8;
  return '255,' + g + ',' + b;
}

/** Night forest with a campfire; Thoughts are burned in the fire. */
export function createForest(): Place {
  let flames: Flame[] = [];
  let embers: Ember[] = [];
  /** Flare-up of the fire while a Thought burns; decays every frame. */
  let boost = 0;

  const fireX = (layout: Layout) => layout.width / 2;

  function addEmber(x: number, y: number) {
    embers.push({ x, y, vx: (Math.random() - 0.5) * 0.6, vy: -(0.5 + Math.random() * 1.3), l: 1, d: 0.003 + Math.random() * 0.005, s: 0.8 + Math.random() * 1.6, ph: Math.random() * TAU });
  }

  function spawn(layout: Layout, k: number, rain: number) {
    const S = layout.unit;
    const fx = fireX(layout);
    const gy = layout.groundY;
    const n = (layout.reducedMotion ? 2 : 4) * (1 + boost) * k * (1 - 0.2 * rain);
    for (let i = 0; i < n; i++) {
      if (flames.length > 700) break;
      flames.push({
        x: fx + (Math.random() - 0.5) * S * 0.9, y: gy - S * 0.08,
        vx: (Math.random() - 0.5) * 0.35, vy: -(S * 0.03 + Math.random() * S * 0.03) * (1 + boost * 0.3),
        l: 1, d: 0.012 + Math.random() * 0.014, s: S * (0.26 + Math.random() * 0.28), ph: Math.random() * TAU,
      });
    }
    if (Math.random() < (0.22 + boost * 0.5) * k && embers.length < 120) addEmber(fx + (Math.random() - 0.5) * S * 0.6, gy - S * 0.6);
  }

  function drawLogs(c: CanvasRenderingContext2D, layout: Layout, flick: number) {
    const S = layout.unit;
    const fx = fireX(layout);
    const glow = 0.35 + 0.35 * flick + boost * 0.2;
    function log(rot: number, dx: number) {
      c.save();
      c.translate(fx + dx, layout.groundY + S * 0.05);
      c.rotate(rot);
      const w = S * 2.3;
      const h = S * 0.34;
      c.fillStyle = '#25160d';
      c.beginPath();
      if (c.roundRect) c.roundRect(-w / 2, -h / 2, w, h, h / 2);
      else c.rect(-w / 2, -h / 2, w, h);
      c.fill();
      c.strokeStyle = 'rgba(255,120,40,' + glow.toFixed(2) + ')';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-w * 0.4, -h * 0.35); c.lineTo(w * 0.4, -h * 0.35); c.stroke();
      c.restore();
    }
    log(0.22, -S * 0.1);
    log(-0.22, S * 0.1);
  }

  return {
    id: 'forest',
    ritual: createBurnRitual({
      target: (layout) => ({ x: fireX(layout), y: layout.groundY - layout.unit * 1.9 }),
      onIgnite: () => { boost = Math.min(1.5, boost + 0.12); },
      onSpark: addEmber,
    }),
    sounds: [
      { id: 'fire', src: audioUrl('fire.mp3'), volume: () => 0.75 },
      { id: 'crack', src: audioUrl('crack.mp3'), volume: () => 0.5 },
    ],

    buildScenery(g, layout) {
      const W = layout.width;
      const H = layout.height;
      const gy = layout.groundY;
      const sky = g.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, '#04060b');
      sky.addColorStop(0.7, '#0d1420');
      sky.addColorStop(1, '#1a1c24');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);

      const mx = W * 0.82;
      const my = Math.min(H * 0.2, 150) + 40;
      const mr = Math.max(14, Math.min(W, H) * 0.03);
      const halo = g.createRadialGradient(mx, my, 0, mx, my, mr * 6);
      halo.addColorStop(0, 'rgba(210,220,240,0.22)'); halo.addColorStop(1, 'rgba(210,220,240,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(mx, my, mr * 6, 0, TAU); g.fill();
      g.fillStyle = '#dfe6f2'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();

      const r = rng(7);
      let x: number;
      for (x = -20; x < W + 40; x += 26 + r() * 22) pine(g, x, gy * 0.99, H * (0.2 + r() * 0.16), 60 + r() * 30, '#0b111a');
      for (x = -30; x < W + 40; x += 44 + r() * 40) pine(g, x, gy * 1.0, H * (0.3 + r() * 0.2), 90 + r() * 40, '#070b12');
      const edge = Math.max(70, W * 0.16);
      for (x = -10; x < edge; x += 60 + r() * 40) pine(g, x, gy + 10, H * (0.55 + r() * 0.25), 150 + r() * 60, '#030508');
      for (x = W + 10; x > W - edge; x -= 60 + r() * 40) pine(g, x, gy + 10, H * (0.55 + r() * 0.25), 150 + r() * 60, '#030508');

      const gr = g.createLinearGradient(0, gy, 0, H);
      gr.addColorStop(0, '#0b0d10'); gr.addColorStop(1, '#030405');
      g.fillStyle = gr; g.fillRect(0, gy, W, H - gy);
    },

    drawFront(c, frame: Frame) {
      const { now, k, layout } = frame;
      const S = layout.unit;
      const fx = fireX(layout);
      const gy = layout.groundY;
      const flick = 0.85 + 0.12 * Math.sin(now * 0.013) + 0.06 * Math.sin(now * 0.031 + 1.3);
      boost *= Math.pow(0.992, k);

      // Light cast by the fire.
      c.globalCompositeOperation = 'lighter';
      const la = (0.16 + boost * 0.08) * flick;
      const amb = c.createRadialGradient(fx, gy - S, 0, fx, gy - S, S * 10);
      amb.addColorStop(0, 'rgba(255,130,50,' + la.toFixed(3) + ')');
      amb.addColorStop(1, 'rgba(255,130,50,0)');
      c.fillStyle = amb; c.fillRect(0, 0, layout.width, layout.height);
      c.save();
      c.translate(fx, gy + S * 0.3); c.scale(1, 0.3);
      const gg = c.createRadialGradient(0, 0, 0, 0, 0, S * 7);
      gg.addColorStop(0, 'rgba(255,140,60,' + (0.4 * flick).toFixed(3) + ')');
      gg.addColorStop(1, 'rgba(255,140,60,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(0, 0, S * 7, 0, TAU); c.fill();
      c.restore();

      c.globalCompositeOperation = 'source-over';
      drawLogs(c, layout, flick);

      // Flame: rain dampens it a little.
      spawn(layout, k, frame.weather.rain ?? 0);
      c.globalCompositeOperation = 'lighter';
      for (let j = flames.length - 1; j >= 0; j--) {
        const p = flames[j];
        p.l -= p.d * k;
        if (p.l <= 0) { flames.splice(j, 1); continue; }
        p.x += (p.vx + Math.sin(now * 0.004 + p.ph) * 0.25) * k + (fx - p.x) * 0.018 * k;
        p.y += p.vy * k;
        p.s *= Math.pow(0.976, k);
        const col = fireColor(p.l);
        const a = Math.min(1, p.l * 1.3) * 0.5;
        const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s);
        gr.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(' + col + ',0)');
        c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill();
      }

      for (let e = embers.length - 1; e >= 0; e--) {
        const m = embers[e];
        m.l -= m.d * k;
        if (m.l <= 0 || m.y < -10) { embers.splice(e, 1); continue; }
        m.x += (m.vx + Math.sin(now * 0.003 + m.ph) * 0.5) * k;
        m.y += m.vy * k;
        const ea = m.l * (0.6 + 0.4 * Math.sin(now * 0.02 + m.ph));
        c.fillStyle = 'rgba(255,' + Math.round(110 + 90 * m.l) + ',50,' + Math.max(0, ea).toFixed(3) + ')';
        c.beginPath(); c.arc(m.x, m.y, m.s, 0, TAU); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    },

    warmthAt(x, y, layout) {
      const S = layout.unit;
      const dist = Math.hypot(x - fireX(layout), y - (layout.groundY - S));
      return Math.max(0, 1 - dist / (S * 7));
    },

    enter() {
      flames = [];
      embers = [];
    },
  };
}
