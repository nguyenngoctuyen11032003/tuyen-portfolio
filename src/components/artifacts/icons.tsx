import type { ArtifactIcon } from '../../data/content';

/** Line icons, 24×24, stroked with currentColor. Rendered once as <symbol>s and referenced with <use>. */
const PATHS = {
  home: 'M3.5 10.5 12 4l8.5 6.5M5.5 9v10.5h13V9M10 19.5v-5h4v5',
  eagle: 'M5.5 20.5c-.4-6.8 2.6-12.3 8.3-14.4 1.9-.7 4-.3 5.4.9l1.3 1.2-2.9.7c-.4 2.1-1.7 3.5-3.8 4M15.3 8.9h.01M8.6 18.6c1.9-1.3 3.6-3.1 5-5.3',
  boat: 'M3 16.5h18l-2.4 3.5H5.6zM11.5 3v13.5M11.5 5 5 14h6.5M13 6.8l5.2 7.2H13',
  vr: 'M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v6a2.5 2.5 0 0 1-2.5 2.5h-3.3L12 14l-3.2 3H5.5A2.5 2.5 0 0 1 3 14.5zM8 11.5h.01M16 11.5h.01',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-.5V4a1.5 1.5 0 0 1 3 0v7.5m0 0V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7-2.6 0-4.1-1.2-5.6-3.4L3.4 15a1.5 1.5 0 0 1 2.4-1.8L8 15.5',
  zoomIn: 'M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0zM20 20l-4.4-4.4M11 8.5v5M8.5 11h5',
  zoomOut: 'M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0zM20 20l-4.4-4.4',
  expand: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  rotateLeft: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4',
  rotateRight: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  material: 'M6.5 4h11L21 9l-9 11L3 9zM3 9h18M9.5 4 8 9l4 11 4-11-1.5-5',
  finish: 'M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zM19 16.5c.2 1.3.9 2 2.2 2.2-1.3.2-2 .9-2.2 2.2-.2-1.3-.9-2-2.2-2.2 1.3-.2 2-.9 2.2-2.2z',
  form: 'M9 3.5h6v3a3 3 0 0 1-6 0zM12 9.5V14M8 14h8l1 3H7zM5 20.5h14',
  mesh: 'M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9',
  contrast: 'M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM12 3.5v17M12 7.5l4.8 4.8M12 12.5l5.6 5.6',
  wind: 'M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7',
} as const;

export type IconName = keyof typeof PATHS | ArtifactIcon;

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      {Object.entries(PATHS).map(([id, d]) => (
        <symbol key={id} id={`atlas-i-${id}`} viewBox="0 0 24 24">
          <path d={d} />
        </symbol>
      ))}
    </svg>
  );
}

export function Icon({ name, size, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`atlas-icon${className ? ` ${className}` : ''}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#atlas-i-${name}`} />
    </svg>
  );
}
