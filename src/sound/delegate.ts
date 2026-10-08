import { isSoundId, type SoundId, type SoundOptions } from './types';

export type SfxCall = [SoundId, SoundOptions];

export interface ClickView {
  scrollY: number;
  innerHeight: number;
  /** null when the click came from the keyboard (event.detail === 0). */
  clientX: number | null;
  panAt: (x: number) => number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const NONE = (): { calls: SfxCall[]; suppressMs: number } => ({ calls: [], suppressMs: 0 });

/**
 * Global click rules (pure). Decides which sounds a click on `el` makes:
 * a "press" layer (buttons → tap, or a data-sfx id) plus, for links, a
 * "navigation" layer (glide for #hash, rise back to the top, linkOut for leaving, mail for
 * mailto/tel, download for downloads).
 */
export function classifyClick(el: Element, view: ClickView): { calls: SfxCall[]; suppressMs: number } {
  const hit = el.closest('a[href], button, [role="button"]');
  if (!hit) return NONE();

  const mark = hit.closest('[data-sfx]')?.getAttribute('data-sfx') ?? null;
  if (mark === 'off') return NONE();
  if ((hit as HTMLButtonElement).disabled === true || hit.getAttribute('aria-disabled') === 'true') {
    return NONE();
  }

  const isAnchor = hit.tagName === 'A' && hit.hasAttribute('href');
  const calls: SfxCall[] = [];
  let suppressMs = 0;

  if (isSoundId(mark)) calls.push([mark, {}]);
  else if (!isAnchor) calls.push(['tap', {}]);

  if (isAnchor) {
    const a = hit as HTMLAnchorElement;
    const raw = (a.getAttribute('href') ?? '').trim();
    if (a.hasAttribute('download')) {
      calls.push(['download', {}]);
    } else if (/^(mailto|tel):/i.test(raw)) {
      calls.push(['mail', {}]);
    } else if (a.getAttribute('target') === '_blank' || isCrossOrigin(a)) {
      calls.push(['linkOut', {}]);
    } else if (raw.startsWith('#') && raw.length > 1) {
      const target = findHashTarget(raw.slice(1), a.ownerDocument);
      if (target) {
        const dy = target.getBoundingClientRect().top;
        const dist = Math.abs(dy);
        const h = Math.max(1, view.innerHeight);
        // Back to the very top of the page gets its own rising run.
        if (dy < 0 && dy + view.scrollY < 4) calls.push(['rise', {}]);
        else
          calls.push([
            'glide',
            { intensity: clamp(dist / (3 * h), 0.15, 1), rate: dy < 0 ? 1.12 : 0.9 },
          ]);
        suppressMs = clamp(600 + dist * 0.4, 600, 2500);
      }
    }
  }

  const pan = view.clientX !== null ? view.panAt(view.clientX) : 0;
  for (const call of calls) call[1] = { ...call[1], pan };
  return { calls, suppressMs };
}

function findHashTarget(id: string, doc: Document): Element | null {
  let decoded = id;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    /* keep raw id */
  }
  return doc.getElementById(decoded);
}

function isCrossOrigin(a: HTMLAnchorElement): boolean {
  const raw = a.getAttribute('href') ?? '';
  if (!/^(https?:)?\/\//i.test(raw)) return false;
  try {
    const base = a.ownerDocument.location?.href ?? 'http://localhost/';
    const url = new URL(raw, base);
    const here = new URL(base);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== here.origin;
  } catch {
    return false;
  }
}
