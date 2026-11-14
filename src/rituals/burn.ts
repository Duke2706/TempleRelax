import { ease, lerp, THOUGHT_FONT_FAMILY } from '../engine/math';
import type { Frame, Layout, Point, Ritual } from '../engine/types';

export interface BurnAnchors {
  /** Where the Thought lands to burn (e.g. just above the flames). */
  target(layout: Layout): Point;
  /** A character caught fire: the fire may flare up. */
  onIgnite(): void;
  /** A burning character throws an ember at this point. */
  onSpark(x: number, y: number): void;
}

interface CharState {
  lit: boolean;
  done: boolean;
}

interface BurningThought {
  chars: string[];
  xs: number[];
  widths: number[];
  fs: number;
  born: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  fly: number;
  state: CharState[];
}

/** The Thought flies into the fire, then each character burns away and rises as ash. */
export function createBurnRitual(anchors: BurnAnchors): Ritual {
  let thoughts: BurningThought[] = [];

  return {
    release(text, origin, c, layout) {
      const chars = Array.from(text);
      let fs = 24;
      c.font = fs + 'px ' + THOUGHT_FONT_FAMILY;
      let widths = chars.map((ch) => c.measureText(ch).width);
      let total = widths.reduce((a, b) => a + b, 0);
      const maxW = layout.width * 0.84;
      if (total > maxW) {
        const k = maxW / total;
        fs = fs * k;
        widths = widths.map((w) => w * k);
        total = maxW;
      }
      const xs: number[] = [];
      let acc = 0;
      widths.forEach((w) => {
        xs.push(acc);
        acc += w;
      });
      const target = anchors.target(layout);
      thoughts.push({
        chars, xs, widths, fs,
        born: performance.now(),
        sx: origin.x - total / 2, sy: origin.y,
        tx: target.x - total / 2, ty: target.y,
        fly: layout.reducedMotion ? 600 : 2200,
        state: chars.map(() => ({ lit: false, done: false })),
      });
    },

    draw(c, frame: Frame) {
      const { now } = frame;
      const S = frame.layout.unit;
      let completed = 0;
      for (let ti = thoughts.length - 1; ti >= 0; ti--) {
        const th = thoughts[ti];
        const age = now - th.born;
        const flying = age < th.fly;
        const p = flying ? ease(age / th.fly) : 1;
        const bx = lerp(th.sx, th.tx, p);
        const by = lerp(th.sy, th.ty, p) + (flying ? Math.sin(age * 0.004) * 6 : 0);
        const burnT = age - th.fly;
        let allDone = true;
        c.font = th.fs + 'px ' + THOUGHT_FONT_FAMILY;
        c.textBaseline = 'middle';
        for (let i = 0; i < th.chars.length; i++) {
          const st = th.state[i];
          if (st.done) continue;
          allDone = false;
          let x = bx + th.xs[i];
          let y = by;
          let alpha = 1;
          let scale = 1;
          let col: string;
          if (flying) {
            const warm = Math.max(0, (p - 0.55) / 0.45);
            col = 'rgba(255,' + Math.round(235 - 90 * warm) + ',' + Math.round(210 - 150 * warm) + ',';
          } else {
            const q = (burnT - i * 70) / 1500;
            if (q < 0) {
              col = 'rgba(255,170,90,';
              y += Math.sin(now * 0.02 + i) * 0.8;
            } else {
              if (!st.lit) {
                st.lit = true;
                anchors.onIgnite();
              }
              if (q >= 1) {
                st.done = true;
                continue;
              }
              y -= q * S * 2.4;
              x += Math.sin(q * 6 + i) * S * 0.25 * q;
              alpha = 1 - q;
              scale = 1 - q * 0.45;
              const g = Math.round(150 - 90 * q);
              const b = Math.round(70 - 60 * q);
              col = 'rgba(255,' + g + ',' + b + ',';
              if (Math.random() < 0.15) anchors.onSpark(x + th.widths[i] / 2, y);
            }
          }
          c.save();
          c.translate(x + th.widths[i] / 2, y);
          c.scale(scale, scale);
          c.shadowColor = 'rgba(255,140,60,0.8)';
          c.shadowBlur = flying ? 4 : 12;
          c.fillStyle = col + alpha.toFixed(3) + ')';
          c.textAlign = 'center';
          c.fillText(th.chars[i], 0, 0);
          c.restore();
        }
        if (allDone) {
          thoughts.splice(ti, 1);
          completed++;
        }
      }
      return completed;
    },

    clear() {
      thoughts = [];
    },
  };
}
