import { audioUrl } from '../engine/audio';
import { TAU } from '../engine/math';
import type { Frame, Layout, Place } from '../engine/types';
import { createFloatRitual } from '../rituals/float';

const moonX = (layout: Layout) => layout.width * 0.7;

/** Moonlit beach; Thoughts are sealed in a bottle and carried off by the sea. */
export function createBeach(): Place {
  return {
    id: 'beach',
    ritual: createFloatRitual(),
    sounds: [{ id: 'wave', src: audioUrl('wave.mp3'), volume: (weatherId) => (weatherId === 'rain' ? 0.4 : 0.5) }],

    buildScenery(g, layout) {
      const W = layout.width;
      const H = layout.height;
      const hy = layout.horizonY;
      const gy = layout.groundY;
      const mX = moonX(layout);
      const sky = g.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, '#04060b'); sky.addColorStop(0.75, '#0e1624'); sky.addColorStop(1, '#1b2433');
      g.fillStyle = sky; g.fillRect(0, 0, W, hy);
      const my = hy * 0.6;
      const mr = Math.max(14, Math.min(W, H) * 0.03);
      const halo = g.createRadialGradient(mX, my, 0, mX, my, mr * 6);
      halo.addColorStop(0, 'rgba(210,220,240,0.24)'); halo.addColorStop(1, 'rgba(210,220,240,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(mX, my, mr * 6, 0, TAU); g.fill();
      g.fillStyle = '#dfe6f2'; g.beginPath(); g.arc(mX, my, mr, 0, TAU); g.fill();
      const sea = g.createLinearGradient(0, hy, 0, gy);
      sea.addColorStop(0, '#101b2a'); sea.addColorStop(1, '#0b1822');
      g.fillStyle = sea; g.fillRect(0, hy, W, gy - hy);
      const hz = g.createLinearGradient(0, hy - 14, 0, hy + 6);
      hz.addColorStop(0, 'rgba(130,160,200,0)'); hz.addColorStop(0.7, 'rgba(130,160,200,0.22)'); hz.addColorStop(1, 'rgba(130,160,200,0)');
      g.fillStyle = hz; g.fillRect(0, hy - 14, W, 20);
      const sand = g.createLinearGradient(0, gy, 0, H);
      sand.addColorStop(0, '#26241f'); sand.addColorStop(1, '#0b0a08');
      g.fillStyle = sand; g.fillRect(0, gy, W, H - gy);
    },

    drawBack(c, frame: Frame) {
      const { now, layout } = frame;
      const W = layout.width;
      const hy = layout.horizonY;
      const gy = layout.groundY;
      const mX = moonX(layout);
      let y: number;
      let t: number;
      let x: number;

      // Moonlight glitter on the water.
      c.globalCompositeOperation = 'lighter';
      for (y = hy + 3; y < gy - 4; y += 4) {
        t = (y - hy) / (gy - hy);
        const wd = 6 + t * 80;
        const jit = Math.sin(now * 0.0018 + y * 0.35) * wd * 0.4;
        const a = 0.28 * (1 - t * 0.35) * (0.55 + 0.45 * Math.sin(now * 0.003 + y * 0.9));
        c.fillStyle = 'rgba(215,225,245,' + Math.max(0, a).toFixed(3) + ')';
        c.fillRect(mX + jit - wd * 0.5, y, wd, 1.6);
      }

      // Swell lines.
      c.globalCompositeOperation = 'source-over';
      c.lineWidth = 1;
      for (let i = 1; i <= 9; i++) {
        t = i / 9;
        y = hy + (gy - hy) * Math.pow(t, 1.7);
        c.strokeStyle = 'rgba(150,185,215,' + (0.05 + 0.07 * t).toFixed(3) + ')';
        c.beginPath();
        const amp = 0.6 + 2.4 * t;
        const ph = now * 0.0006 * (0.6 + t) + i * 1.7;
        for (x = 0; x <= W; x += 16) {
          const yy = y + Math.sin(x * 0.012 * (1.3 - t * 0.4) + ph) * amp;
          if (x === 0) c.moveTo(x, yy);
          else c.lineTo(x, yy);
        }
        c.stroke();
      }

      // Waves washing up the sand.
      const cyc = now * 0.00055;
      const edge = gy + 8 + 14 * Math.sin(cyc);
      const ey = (px: number) => edge + Math.sin(px * 0.014 + now * 0.0011) * 3 + Math.sin(px * 0.037 - now * 0.0017) * 1.5;
      c.fillStyle = '#0b1822';
      c.beginPath();
      c.moveTo(0, gy - 30);
      for (x = 0; x <= W; x += 12) c.lineTo(x, ey(x));
      c.lineTo(W, gy - 30);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(230,240,250,' + (0.2 + 0.16 * Math.max(0, Math.cos(cyc))).toFixed(3) + ')';
      c.lineWidth = 2;
      c.beginPath();
      for (x = 0; x <= W; x += 12) {
        if (x === 0) c.moveTo(x, ey(x));
        else c.lineTo(x, ey(x));
      }
      c.stroke();
    },
  };
}
