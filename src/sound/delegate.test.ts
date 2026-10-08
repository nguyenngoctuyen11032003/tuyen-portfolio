import { afterEach, describe, expect, it } from 'vitest';
import { classifyClick } from './delegate';

const view = (over: Partial<Parameters<typeof classifyClick>[1]> = {}) => ({
  scrollY: 0,
  innerHeight: 800,
  clientX: null,
  panAt: (x: number) => x / 1000,
  ...over,
});

function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

function placeAt(el: Element, top: number) {
  el.getBoundingClientRect = () =>
    ({ top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top }) as DOMRect;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('classifyClick', () => {
  it('ignores non-interactive elements', () => {
    const host = mount('<p><span>text</span></p>');
    expect(classifyClick(host.querySelector('span')!, view())).toEqual({ calls: [], suppressMs: 0 });
  });

  it('plays tap for a button (from a nested icon)', () => {
    const host = mount('<button><svg><path></path></svg></button><div role="button">x</div>');
    expect(classifyClick(host.querySelector('path')!, view()).calls).toEqual([['tap', { pan: 0 }]]);
    expect(classifyClick(host.querySelector('[role=button]')!, view()).calls).toEqual([['tap', { pan: 0 }]]);
  });

  it('pans by pointer position, centred for keyboard clicks', () => {
    const host = mount('<button>b</button>');
    const btn = host.querySelector('button')!;
    expect(classifyClick(btn, view({ clientX: 300 })).calls[0][1].pan).toBeCloseTo(0.3);
    expect(classifyClick(btn, view({ clientX: null })).calls[0][1].pan).toBe(0);
  });

  it('is silent for disabled buttons and data-sfx="off" ancestors', () => {
    const host = mount(
      '<button disabled>a</button><button aria-disabled="true">b</button><nav data-sfx="off"><a href="#x">c</a><button>d</button></nav><section id="x"></section>',
    );
    const [a, b] = host.querySelectorAll('button');
    expect(classifyClick(a, view()).calls).toEqual([]);
    expect(classifyClick(b, view()).calls).toEqual([]);
    expect(classifyClick(host.querySelector('nav a')!, view())).toEqual({ calls: [], suppressMs: 0 });
    expect(classifyClick(host.querySelector('nav button')!, view()).calls).toEqual([]);
  });

  it('glides down to a #hash target below and suppresses auto sounds', () => {
    const host = mount('<a href="#contact">go</a><section id="contact"></section>');
    placeAt(host.querySelector('#contact')!, 4000);
    const r = classifyClick(host.querySelector('a')!, view());
    expect(r.calls).toEqual([['glide', { intensity: 1, rate: 0.9, pan: 0 }]]);
    expect(r.suppressMs).toBe(2200);
  });

  it('glides up to a target above, with a floor on intensity and suppression', () => {
    const host = mount('<a href="#hero">top</a><section id="hero"></section>');
    placeAt(host.querySelector('#hero')!, -100);
    const r = classifyClick(host.querySelector('a')!, view({ scrollY: 5000 }));
    expect(r.calls).toEqual([['glide', { intensity: 0.15, rate: 1.12, pan: 0 }]]);
    expect(r.suppressMs).toBe(640);
  });

  it('rises when the target is the very top of the page', () => {
    const host = mount('<a href="#hero">top</a><section id="hero"></section>');
    placeAt(host.querySelector('#hero')!, -3000);
    const r = classifyClick(host.querySelector('a')!, view({ scrollY: 3000 }));
    expect(r.calls).toEqual([['rise', { pan: 0 }]]);
    expect(r.suppressMs).toBe(1800);
  });

  it('caps suppression at 2500 ms', () => {
    const host = mount('<a href="#far">x</a><section id="far"></section>');
    placeAt(host.querySelector('#far')!, -20000);
    expect(classifyClick(host.querySelector('a')!, view()).suppressMs).toBe(2500);
  });

  it('is silent for a #hash with no target', () => {
    const host = mount('<a href="#missing">x</a><a href="#">y</a>');
    const [a, b] = host.querySelectorAll('a');
    expect(classifyClick(a, view()).calls).toEqual([]);
    expect(classifyClick(b, view()).calls).toEqual([]);
  });

  it('plays linkOut for new tabs and other origins', () => {
    const host = mount(['<a href="/x" target="_blank">1</a>', '<a href="https://github.com/x">2</a>'].join(''));
    for (const a of host.querySelectorAll('a')) {
      expect(classifyClick(a, view()).calls).toEqual([['linkOut', { pan: 0 }]]);
    }
  });

  it('plays mail for mailto and tel links', () => {
    const host = mount(['<a href="mailto:a@b.c" target="_blank">1</a>', '<a href="tel:123">2</a>'].join(''));
    for (const a of host.querySelectorAll('a')) {
      expect(classifyClick(a, view()).calls).toEqual([['mail', { pan: 0 }]]);
    }
  });

  it('is silent for same-origin page links', () => {
    const host = mount(`<a href="${window.location.origin}/cv">x</a><a href="/about">y</a>`);
    for (const a of host.querySelectorAll('a')) expect(classifyClick(a, view()).calls).toEqual([]);
  });

  it('plays download for downloads', () => {
    const host = mount('<a href="/cv.pdf" download>cv</a>');
    expect(classifyClick(host.querySelector('a')!, view()).calls).toEqual([['download', { pan: 0 }]]);
  });

  it('layers data-sfx="press" with the navigation sound', () => {
    const host = mount('<a data-sfx="press" href="#contact">Liên hệ</a><section id="contact"></section>');
    placeAt(host.querySelector('#contact')!, 2400);
    const r = classifyClick(host.querySelector('a')!, view({ clientX: 500 }));
    expect(r.calls).toEqual([
      ['press', { pan: 0.5 }],
      ['glide', { intensity: 1, rate: 0.9, pan: 0.5 }],
    ]);
    expect(r.suppressMs).toBe(1560);
  });

  it('uses a data-sfx id on a button instead of tap, ignoring unknown ids', () => {
    const host = mount('<button data-sfx="press">a</button><button data-sfx="nope">b</button>');
    const [a, b] = host.querySelectorAll('button');
    expect(classifyClick(a, view()).calls).toEqual([['press', { pan: 0 }]]);
    expect(classifyClick(b, view()).calls).toEqual([['tap', { pan: 0 }]]);
  });

  it('press + linkOut for an external CTA, press + mail for a mail CTA', () => {
    const host = mount(
      '<a data-sfx="press" href="https://github.com/x">gh</a><a data-sfx="press" href="mailto:hi@example.com">mail</a>',
    );
    const [gh, mail] = host.querySelectorAll('a');
    expect(classifyClick(gh, view()).calls).toEqual([
      ['press', { pan: 0 }],
      ['linkOut', { pan: 0 }],
    ]);
    expect(classifyClick(mail, view()).calls).toEqual([
      ['press', { pan: 0 }],
      ['mail', { pan: 0 }],
    ]);
  });
});
