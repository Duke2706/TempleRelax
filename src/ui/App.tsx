import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createMixer, soundTargets, type Mixer } from '../engine/audio';
import { createEngine, type Engine } from '../engine/engine';
import { useTranslation } from 'react-i18next';
import i18n, { changeLocale } from '../i18n';
import { LOCALE_NAMES, SUPPORTED_LOCALES, type Locale } from '../i18n/locale';
import { noPresence } from '../presence/noop';
import { allSoundLayers, DEFAULT_PLACE, DEFAULT_WEATHER, places, weathers } from '../registry';

const NOTE_MS = 6500;
const presence = noPresence;


/**
 * Keys built from registry ids (Place, Weather) can't be checked by the compiler;
 * the locale parity test checks that every registered id has its copy.
 */
const dyn = (key: string) => key as 'title';

/** A copy entry that holds a list (hint lines, Closing lines). */
function list(key: string): string[] {
  return i18n.t(dyn(key), { returnObjects: true }) as unknown as string[];
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
  // The note holds a copy key, not text, so it follows a language switch while visible.
  const [note, setNote] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });
  const [share, setShare] = useState(false);
  const noteTimer = useRef<number | undefined>(undefined);

  const { t, i18n: i18nInstance } = useTranslation();
  const locale = i18nInstance.resolvedLanguage as Locale;
  const placeKey = (field: string) => dyn(`places.${placeId}.${field}`);
  const hint = list(`places.${placeId}.hint`);

  function say(key: string) {
    setNote({ key, visible: true });
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
        const lines = list(`places.${id}.closingLines`);
        sayRef.current(`places.${id}.closingLines.${Math.floor(Math.random() * lines.length)}`);
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
    const ownKey = `places.${placeId}.weatherNotes.${id}`;
    const key = i18n.exists(ownKey) ? ownKey : `weatherNotes.${id}`;
    if (i18n.exists(key)) say(key);
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
      <canvas id="scene" ref={canvasRef} aria-label={t(placeKey('sceneLabel'))}></canvas>
      <div className="vignette"></div>

      <header>
        <h1>{t('title')}</h1>
        <p className="hint">
          {hint[0]}
          <br />
          {hint[1]}
        </p>
        <p className={'note' + (note.visible ? ' show' : '')} role="status" aria-live="polite">
          {note.key && t(dyn(note.key))}
        </p>
      </header>

      <div className="wx" role="group" aria-label={t('weatherGroupLabel')}>
        {weathers.map((w) => (
          <button key={w.id} type="button" aria-pressed={w.id === weatherId} onClick={() => chooseWeather(w.id)}>
            {t(dyn(`weather.${w.id}`))}
          </button>
        ))}
      </div>
      <div className="pl" role="group" aria-label={t('placeGroupLabel')}>
        {places.map((p) => (
          <button key={p.id} type="button" aria-pressed={p.id === placeId} onClick={() => choosePlace(p.id)}>
            {t(dyn(`places.${p.id}.name`))}
          </button>
        ))}
      </div>
      <button className="sound" type="button" aria-pressed={soundOn} onClick={toggleSound}>
        {soundOn ? t('sound.off') : t('sound.on')}
      </button>
      <div className="lang" role="group" aria-label={t('languageGroupLabel')}>
        {SUPPORTED_LOCALES.map((l) => (
          <button key={l} type="button" lang={l} aria-pressed={l === locale} onClick={() => changeLocale(l)}>
            {LOCALE_NAMES[l]}
          </button>
        ))}
      </div>
      <div className="count">{t(placeKey('counter'), { count: counts[placeId] ?? 0 })}</div>

      <div className="panel" ref={panelRef}>
        <p className="keep">{t(placeKey('keep'))}</p>
        <div className="row">
          <input
            ref={inputRef}
            type="text"
            maxLength={40}
            autoComplete="off"
            placeholder={t('placeholder')}
            aria-label={t(placeKey('inputLabel'))}
            onKeyDown={onKeyDown}
          />
          <button type="button" onClick={release}>
            {t(placeKey('action'))}
          </button>
        </div>
        <label className="share" hidden={!presence.available}>
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /> {t('share')}
        </label>
      </div>
    </>
  );
}
