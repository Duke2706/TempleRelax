import type { Place, SoundLayer, Weather } from './engine/types';
import { createBeach } from './places/beach';
import { createForest } from './places/forest';
import { clear, createRain, createSnow } from './weathers';

/** Every selectable Place, in display order. Add a new Place here. */
export const places: Place[] = [createForest(), createBeach()];

/** Every selectable Weather, in display and drawing order. */
export const weathers: Weather[] = [clear, createRain(), createSnow()];

export const allSoundLayers: SoundLayer[] = [
  ...places.flatMap((p) => p.sounds),
  ...weathers.flatMap((w) => (w.sound ? [w.sound] : [])),
];

export const DEFAULT_PLACE = 'forest';
export const DEFAULT_WEATHER = 'clear';
