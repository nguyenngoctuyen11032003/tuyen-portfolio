import { useSyncExternalStore } from 'react';
import { sfx, type SoundEngine } from './engine';
import type { SoundSnapshot } from './types';

const SERVER_SNAPSHOT: SoundSnapshot = { enabled: false, supported: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;

export interface UseSound {
  enabled: boolean;
  supported: boolean;
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
    setEnabled: sfx.setEnabled,
    toggle: sfx.toggle,
    play: sfx.play,
  };
}
