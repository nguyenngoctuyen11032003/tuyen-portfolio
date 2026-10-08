import { useEffect, type ReactNode } from 'react';
import { sfx } from './engine';

/** Installs the engine's global listeners (gesture unlock, visibility, reduced motion, click delegate). */
export function SoundProvider({ children }: { children: ReactNode }) {
  useEffect(() => sfx.install(), []);
  return <>{children}</>;
}
