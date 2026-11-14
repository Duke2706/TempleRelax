import type { Presence } from '../engine/types';

/** Static site: nobody else is connected. A realtime implementation can replace this later. */
export const noPresence: Presence = {
  available: false,
  onRelease: () => () => {},
  publish: () => {},
};
