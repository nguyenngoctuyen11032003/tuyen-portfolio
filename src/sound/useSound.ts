import { useSyncExternalStore } from 'react';
import { sfx, type SoundEngine } from './engine';
import type { SoundSnapshot } from './types';

const SERVER_SNAPSHOT: SoundSnapshot = { enabled: false, supported: false, live: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;

export interface UseSound {
  enabled: boolean;
  supported: boolean;
  /** Audio is actually running (unlocked by a gesture). */
  live: boolean;
  setEnabled: (on: boolean) => void;
  toggle: () => void;
  play: SoundEngine['play'];
}

/** Reads the global sound engine (no context needed). */
export function useSound(): UseSound {
  const snap = useSyncExternalStore(sfx.subscribe, sfx.getSnapshot, getServerSnapshot);
  return {
    enabled: snap.enabled,
    supported: snap.supported,
    live: snap.live,
    setEnabled: sfx.setEnabled,
    toggle: sfx.toggle,
    play: sfx.play,
  };
}
