import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createMixer, soundTargets, type Mixer } from '../engine/audio';
import { createEngine, type Engine } from '../engine/engine';
import { ko as copy } from '../copy/ko';
import { noPresence } from '../presence/noop';
import { allSoundLayers, DEFAULT_PLACE, DEFAULT_WEATHER, places, weathers } from '../registry';

const NOTE_MS = 6500;
const presence = noPresence;

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const mixerRef = useRef<Mixer | null>(null);

  const [placeId, setPlaceId] = useState(DEFAULT_PLACE);
  const [weatherId, setWeatherId] = useState(DEFAULT_WEATHER);
  const [soundOn, setSoundOn] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [note, setNote] = useState<{ text: string; visible: boolean }>({ text: '', visible: false });
  const [share, setShare] = useState(false);
  const noteTimer = useRef<number | undefined>(undefined);

  const placeCopy = copy.places[placeId];

  function say(text: string) {
    setNote({ text, visible: true });
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote((n) => ({ ...n, visible: false })), NOTE_MS);
  }
  // The engine calls back from its frame loop; keep the latest `say` reachable without re-creating it.
  const sayRef = useRef(say);
  sayRef.current = say;

  useEffect(() => {
    const engine = createEngine(canvasRef.current!, {
      places,
      weathers,
      presence,
      initialPlace: DEFAULT_PLACE,
      initialWeather: DEFAULT_WEATHER,
      releaseOrigin: (layout) => ({ x: layout.width / 2, y: panelRef.current!.getBoundingClientRect().top - 26 }),
      onRitualComplete: (id) => {
        setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
        sayRef.current(pick(copy.places[id].closingLines));
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    mixerRef.current ??= createMixer(allSoundLayers);
  }, []);

  useEffect(() => {
    document.body.dataset.place = placeId;
  }, [placeId]);

  useEffect(() => {
    const place = places.find((p) => p.id === placeId)!;
    const weather = weathers.find((w) => w.id === weatherId)!;
    mixerRef.current?.setTargets(soundTargets(place, weather));
  }, [placeId, weatherId]);

  function choosePlace(id: string) {
    if (id === placeId) return;
    engineRef.current?.setPlace(id);
    setPlaceId(id);
    setNote((n) => ({ ...n, visible: false }));
  }

  function chooseWeather(id: string) {
    engineRef.current?.setWeather(id);
    setWeatherId(id);
    const text = placeCopy.weatherNotes[id] ?? copy.weatherNotes[id];
    if (text) say(text);
  }

  function toggleSound() {
    const next = !soundOn;
    // Called inside the click handler: browsers only start audio from a user gesture.
    mixerRef.current?.setEnabled(next);
    setSoundOn(next);
  }

  function release() {
    const input = inputRef.current!;
    const text = input.value.replace(/\s+/g, ' ').trim();
    if (!text) {
      input.focus();
      return;
    }
    engineRef.current?.release(text);
    presence.publish(share ? text : '');
    input.value = '';
    input.focus();
  }

  function onKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter' && !ev.nativeEvent.isComposing && ev.keyCode !== 229) {
      ev.preventDefault();
      release();
    }
  }

  return (
    <>
      <canvas id="scene" ref={canvasRef} aria-label={placeCopy.sceneLabel}></canvas>
      <div className="vignette"></div>

      <header>
        <h1>{copy.title}</h1>
        <p className="hint">
          {placeCopy.hint[0]}
          <br />
          {placeCopy.hint[1]}
        </p>
        <p className={'note' + (note.visible ? ' show' : '')} role="status" aria-live="polite">
          {note.text}
        </p>
      </header>

      <div className="wx" role="group" aria-label={copy.weatherGroupLabel}>
        {weathers.map((w) => (
          <button key={w.id} type="button" aria-pressed={w.id === weatherId} onClick={() => chooseWeather(w.id)}>
            {copy.weatherNames[w.id]}
          </button>
        ))}
      </div>
      <div className="pl" role="group" aria-label={copy.placeGroupLabel}>
        {places.map((p) => (
          <button key={p.id} type="button" aria-pressed={p.id === placeId} onClick={() => choosePlace(p.id)}>
            {copy.places[p.id].name}
          </button>
        ))}
      </div>
      <button className="sound" type="button" aria-pressed={soundOn} onClick={toggleSound}>
        {soundOn ? copy.soundOff : copy.soundOn}
      </button>
      <div className="count">{placeCopy.counter(counts[placeId] ?? 0)}</div>

      <div className="panel" ref={panelRef}>
        <p className="keep">{placeCopy.keep}</p>
        <div className="row">
          <input
            ref={inputRef}
            type="text"
            maxLength={40}
            autoComplete="off"
            placeholder={copy.placeholder}
            aria-label={placeCopy.inputLabel}
            onKeyDown={onKeyDown}
          />
          <button type="button" onClick={release}>
            {placeCopy.action}
          </button>
        </div>
        <label className="share" hidden={!presence.available}>
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> {copy.share}
        </label>
      </div>
    </>
  );
}
