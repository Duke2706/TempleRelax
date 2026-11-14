import type { Place, SoundLayer, Weather } from './types';

/** URL of an ambient recording shipped in public/assets/audio. */
export function audioUrl(file: string): string {
  return import.meta.env.BASE_URL + 'assets/audio/' + file;
}

/** Target volume of every layer for the current Place and Weather. */
export function soundTargets(place: Place, weather: Weather): Map<string, number> {
  const targets = new Map<string, number>();
  for (const layer of place.sounds) targets.set(layer.id, layer.volume(weather.id));
  if (weather.sound) targets.set(weather.sound.id, weather.sound.volume(weather.id));
  return targets;
}

/** Time span between the first and last audible sample, so loops skip encoder padding. */
function loopBounds(buf: AudioBuffer): { start: number; end: number } {
  const data = buf.getChannelData(0);
  const threshold = 1e-4;
  let s = 0;
  let e = data.length - 1;
  while (s < e && Math.abs(data[s]) < threshold) s++;
  while (e > s && Math.abs(data[e]) < threshold) e--;
  if (e <= s) return { start: 0, end: buf.duration };
  return { start: s / buf.sampleRate, end: (e + 1) / buf.sampleRate };
}

interface LiveLayer {
  gain: GainNode | null;
  ready: boolean;
}

export interface Mixer {
  /** Must be called from a user gesture the first time, so the browser allows audio. */
  setEnabled(on: boolean): void;
  setTargets(targets: Map<string, number>): void;
}

/** Mixes looping recordings with smooth fades. Each layer is fetched and decoded only when first needed. */
export function createMixer(allLayers: SoundLayer[]): Mixer {
  let ctx: AudioContext | null = null;
  let enabled = false;
  let targets = new Map<string, number>();
  const live = new Map<string, LiveLayer>();

  function makeLayer(layer: SoundLayer) {
    const audio = ctx!;
    const L: LiveLayer = { gain: null, ready: false };
    live.set(layer.id, L);
    fetch(layer.src)
      .then((r) => {
        if (!r.ok) throw new Error('Audio ' + layer.src + ' failed: ' + r.status);
        return r.arrayBuffer();
      })
      .then((data) => audio.decodeAudioData(data))
      .then((buf) => {
        const gain = audio.createGain();
        gain.gain.value = 0;
        gain.connect(audio.destination);
        const src = audio.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const { start, end } = loopBounds(buf);
        src.loopStart = start;
        src.loopEnd = end;
        src.connect(gain);
        src.start(0, start + Math.random() * (end - start) * 0.5);
        L.gain = gain;
        L.ready = true;
        apply();
      })
      .catch((err: unknown) => {
        // Forget the failed layer so the next apply() can retry it.
        live.delete(layer.id);
        console.warn(err);
      });
  }

  function apply() {
    if (!ctx) return;
    for (const layer of allLayers) {
      const w = enabled ? (targets.get(layer.id) ?? 0) : 0;
      if (w > 0 && !live.has(layer.id)) makeLayer(layer);
      const L = live.get(layer.id);
      if (L && L.ready && L.gain) L.gain.gain.setTargetAtTime(w, ctx.currentTime, 0.7);
    }
  }

  return {
    setEnabled(on) {
      enabled = on;
      if (on) {
        if (!ctx) {
          try {
            ctx = new AudioContext({ sampleRate: 32000 });
          } catch {
            ctx = new AudioContext();
          }
        } else {
          void ctx.resume();
        }
        apply();
      } else {
        apply();
        setTimeout(() => {
          if (!enabled && ctx) void ctx.suspend();
        }, 1800);
      }
    },
    setTargets(next) {
      targets = next;
      apply();
    },
  };
}
