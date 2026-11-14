import { audioUrl } from '../engine/audio';
import { TAU } from '../engine/math';
import type { Layout, Weather } from '../engine/types';

export const clear: Weather = {
  id: 'clear',
  init() {},
  draw() {},
};

interface Drop { x: number; y: number; v: number; vx: number; land: number }
interface Splash { x: number; y: number; l: number }

export function createRain(): Weather {
  let drops: Drop[] = [];
  let splashes: Splash[] = [];
  return {
    id: 'rain',
    starDimming: 0.9,
    sound: { id: 'rain', src: audioUrl('rain.mp3'), volume: () => 0.6 },
    init(layout: Layout) {
      const { width: W, height: H, groundY: gy } = layout;
      const n = Math.max(120, Math.min(280, Math.floor(W / 6)));
      drops = [];
      for (let i = 0; i < n; i++) drops.push({ x: Math.random() * (W + 100), y: Math.random() * H, v: 14 + Math.random() * 8, vx: -2.5, land: gy + Math.random() * (H - gy) });
    },
    draw(c, frame, wr) {
      const { k, layout } = frame;
      const { width: W, height: H, groundY: gy } = layout;
      if (wr > 0.01) {
        c.fillStyle = 'rgba(5,8,14,' + (0.5 * wr).toFixed(3) + ')';
        c.fillRect(0, 0, W, gy);
        const n = Math.floor(drops.length * wr);
        c.strokeStyle = 'rgba(170,190,225,' + (0.4 * wr).toFixed(3) + ')';
        c.lineWidth = 1;
        c.beginPath();
        for (let i = 0; i < n; i++) {
          const d = drops[i];
          d.y += d.v * k;
          d.x += d.vx * k;
          if (d.y > d.land) {
            if (splashes.length < 40 && Math.random() < 0.5) splashes.push({ x: d.x, y: d.land, l: 1 });
            d.y = -20;
            d.x = Math.random() * (W + 100);
            d.land = gy + Math.random() * (H - gy);
          }
          c.moveTo(d.x, d.y);
          c.lineTo(d.x - d.vx * 1.6, d.y - d.v * 1.6);
        }
        c.stroke();
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.l -= 0.06 * k;
        if (sp.l <= 0) { splashes.splice(i, 1); continue; }
        c.strokeStyle = 'rgba(170,190,225,' + (sp.l * 0.35 * Math.max(wr, 0.2)).toFixed(3) + ')';
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(sp.x, sp.y, 2 + (1 - sp.l) * 8, 1 + (1 - sp.l) * 3, 0, 0, TAU);
        c.stroke();
      }
    },
  };
}

interface Flake { x: number; y: number; v: number; s: number; p: number; r: number }

/** Snow is silent; it warms its tint near any heat the Place reports. */
export function createSnow(): Weather {
  let flakes: Flake[] = [];
  return {
    id: 'snow',
    init(layout: Layout) {
      const { width: W, height: H } = layout;
      const n = Math.max(90, Math.min(200, Math.floor(W / 8)));
      flakes = [];
      for (let j = 0; j < n; j++) flakes.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 1.1, s: 0.6 + Math.random() * 1.4, p: Math.random() * TAU, r: 0.9 + Math.random() * 1.7 });
    },
    draw(c, frame, ws, place) {
      if (ws <= 0.01) return;
      const { now, k, layout } = frame;
      const { width: W, height: H, groundY: gy } = layout;
      c.fillStyle = 'rgba(120,140,170,' + (0.07 * ws).toFixed(3) + ')';
      c.fillRect(0, 0, W, gy);
      c.fillStyle = 'rgba(205,220,240,' + (0.1 * ws).toFixed(3) + ')';
      c.fillRect(0, gy, W, H - gy);
      const n = Math.floor(flakes.length * ws);
      for (let i = 0; i < n; i++) {
        const d = flakes[i];
        d.y += d.v * k;
        d.x += Math.sin(now * 0.001 * d.s + d.p) * 0.35 * k;
        if (d.y > H + 4) { d.y = -4; d.x = Math.random() * W; }
        const warm = place.warmthAt ? place.warmthAt(d.x, d.y, layout) : 0;
        c.fillStyle = 'rgba(255,' + Math.round(242 - 80 * warm) + ',' + Math.round(255 - 150 * warm) + ',' + (0.85 * ws).toFixed(3) + ')';
        c.beginPath();
        c.arc(d.x, d.y, d.r, 0, TAU);
        c.fill();
      }
    },
  };
}
