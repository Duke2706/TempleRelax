/** Shared scene geometry, computed by the engine on every resize and handed to Places, Rituals and Weathers. */
export interface Layout {
  width: number;
  height: number;
  dpr: number;
  /** Y of the ground line (forest floor, shoreline). */
  groundY: number;
  /** Y of the sea horizon. */
  horizonY: number;
  /** Unit scale for scenery details, proportional to the viewport. */
  unit: number;
  reducedMotion: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/** Per-frame state passed to everything that draws. */
export interface Frame {
  now: number;
  /** Frame-time multiplier: 1 at 60 fps. */
  k: number;
  layout: Layout;
  /** Smoothed intensity (0..1) of every Weather, keyed by Weather id. */
  weather: Readonly<Record<string, number>>;
}

/** One looping ambient recording. */
export interface SoundLayer {
  id: string;
  src: string;
  /** Target volume (0..1) given the selected Weather id. */
  volume: (weatherId: string) => number;
}

/** What happens to a released Thought. Reusable across Places. */
export interface Ritual {
  release(text: string, origin: Point, c: CanvasRenderingContext2D, layout: Layout): void;
  /** Draws every Thought in flight; returns how many Thoughts finished their Ritual this frame. */
  draw(c: CanvasRenderingContext2D, frame: Frame): number;
  /** Drops every Thought in flight without completing it. */
  clear(): void;
}

/** A selectable setting: scenery, ambient sounds and the Ritual applied to a Thought. */
export interface Place {
  id: string;
  ritual: Ritual;
  sounds: SoundLayer[];
  /** Draws the static background once per resize or Place switch. */
  buildScenery(g: CanvasRenderingContext2D, layout: Layout): void;
  /** Animated layer drawn under the Weather (e.g. the sea). */
  drawBack?(c: CanvasRenderingContext2D, frame: Frame): void;
  /** Animated layer drawn over the Weather (e.g. the fire). */
  drawFront?(c: CanvasRenderingContext2D, frame: Frame): void;
  /** Heat (0..1) at a point; snow uses it to warm its tint near a fire. */
  warmthAt?(x: number, y: number, layout: Layout): number;
  /** Called when the visitor enters this Place. */
  enter?(): void;
}

/** A sky condition layered over any Place. */
export interface Weather {
  id: string;
  sound?: SoundLayer;
  /** How much this Weather dims the stars at full intensity (0..1). */
  starDimming?: number;
  init(layout: Layout): void;
  /** Called every frame, also at zero intensity so lingering effects can fade out. */
  draw(c: CanvasRenderingContext2D, frame: Frame, intensity: number, place: Place): void;
}

/** Other visitors who have the page open right now. */
export interface Presence {
  readonly available: boolean;
  /** Subscribes to Thoughts released by others; returns an unsubscribe function. */
  onRelease(listener: (text: string) => void): () => void;
  /** Tells others a Thought was released; `text` is empty when the visitor does not share it. */
  publish(text: string): void;
}
