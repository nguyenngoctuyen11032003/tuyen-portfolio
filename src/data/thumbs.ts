import manifest from './projectThumbs.json';

interface ThumbInfo {
  thumb: string;
  medium?: string;
  w: number;
  h: number;
}

const THUMBS: Record<string, ThumbInfo> = manifest;

/** Small WebP version of a project screenshot; falls back to the original when none was generated. */
export function thumbOf(src: string): string {
  return THUMBS[src]?.thumb ?? src;
}

/** ~1600px WebP for large views (stage, gallery); falls back to the original. */
export function mediumOf(src: string): string {
  return THUMBS[src]?.medium ?? src;
}

/** Width / height of the original screenshot (3/2 when unknown). */
export function aspectOf(src: string): number {
  const info = THUMBS[src];
  return info ? info.w / info.h : 1.5;
}
