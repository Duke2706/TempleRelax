import { ease, lerp, THOUGHT_FONT_FAMILY } from '../engine/math';
import type { Frame, Layout, Ritual } from '../engine/types';

interface Bottle {
  txt: string;
  fs: number;
  born: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  fly: number;
  dur: number;
  dir: number;
}

function drawBottle(c: CanvasRenderingContext2D, x: number, y: number, sc: number, rot: number, a: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sc, sc);
  c.globalAlpha = Math.max(0, Math.min(1, a));
  c.fillStyle = 'rgba(170,215,230,0.32)';
  c.strokeStyle = 'rgba(215,240,250,0.85)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-4, -26); c.lineTo(4, -26); c.lineTo(4, -12);
  c.quadraticCurveTo(12, -10, 12, 0); c.lineTo(12, 18);
  c.quadraticCurveTo(12, 25, 5, 25); c.lineTo(-5, 25);
  c.quadraticCurveTo(-12, 25, -12, 18); c.lineTo(-12, 0);
  c.quadraticCurveTo(-12, -10, -4, -12); c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = '#a67c52'; c.fillRect(-4.5, -31, 9, 6);
  c.fillStyle = 'rgba(245,232,205,0.95)'; c.fillRect(-3.5, -7, 7, 24);
  c.strokeStyle = 'rgba(120,95,60,0.5)'; c.lineWidth = 0.8;
  c.beginPath(); c.moveTo(-2, -2); c.lineTo(2, -2); c.moveTo(-2, 3); c.lineTo(2, 3); c.moveTo(-2, 8); c.lineTo(2, 8); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-8.5, 2); c.lineTo(-8.5, 16); c.stroke();
  c.restore();
}

/** The Thought is sealed in a bottle at the shoreline and the sea carries it to the horizon. */
export function createFloatRitual(): Ritual {
  let bottles: Bottle[] = [];

  return {
    release(text, origin, c, layout: Layout) {
      let fs = 22;
      c.font = fs + 'px ' + THOUGHT_FONT_FAMILY;
      const total = c.measureText(text).width;
      const maxW = layout.width * 0.84;
      if (total > maxW) fs = (fs * maxW) / total;
      const reduce = layout.reducedMotion;
      bottles.push({
        txt: text, fs,
        born: performance.now(),
        sx: origin.x, sy: origin.y,
        tx: layout.width / 2 + (Math.random() - 0.5) * layout.width * 0.16,
        ty: layout.groundY + 2,
        fly: reduce ? 700 : 2000,
        dur: reduce ? 6000 : 18000,
        dir: Math.random() < 0.5 ? -1 : 1,
      });
    },

    draw(c, frame: Frame) {
      const { now, layout } = frame;
      const W = layout.width;
      let completed = 0;
      for (let i = bottles.length - 1; i >= 0; i--) {
        const b = bottles[i];
        const age = now - b.born;
        if (age < b.fly) {
          const p = ease(age / b.fly);
          const x = lerp(b.sx, b.tx, p);
          const y = lerp(b.sy, b.ty - 34, p);
          const ta = p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.3);
          if (ta > 0) {
            c.save();
            c.translate(x, y);
            c.scale(lerp(1, 0.55, p), lerp(1, 0.55, p));
            c.font = b.fs + 'px ' + THOUGHT_FONT_FAMILY;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.shadowColor = 'rgba(200,225,245,0.6)';
            c.shadowBlur = 6;
            c.fillStyle = 'rgba(241,230,211,' + ta.toFixed(3) + ')';
            c.fillText(b.txt, 0, 0);
            c.restore();
          }
          if (p > 0.6) drawBottle(c, b.tx, b.ty + Math.sin(age * 0.003) * 2, 1.5, Math.sin(age * 0.002) * 0.1, (p - 0.6) / 0.4);
        } else {
          const tf = (age - b.fly) / b.dur;
          if (tf >= 1) {
            bottles.splice(i, 1);
            completed++;
            continue;
          }
          const e = Math.pow(tf, 0.85);
          const bx = b.tx + b.dir * e * W * 0.08 + Math.sin(tf * 10) * W * 0.012;
          const by = lerp(b.ty, layout.horizonY + 8, e);
          const sc = lerp(1.5, 0.16, e);
          drawBottle(c, bx, by + Math.sin(age * 0.003) * 3 * sc, sc, Math.sin(age * 0.0022 + 1) * 0.28, tf < 0.8 ? 1 : (1 - tf) / 0.2);
        }
      }
      return completed;
    },

    clear() {
      bottles = [];
    },
  };
}
