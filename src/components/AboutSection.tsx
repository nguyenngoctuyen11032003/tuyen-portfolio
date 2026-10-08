import { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { sfx } from '../sound';
import { animateValue, coverRect, project, roundedRectPoints } from './about/portal';
import avatarUrl from '../assets/avatar.jpg';
import './about/about.css';

/** Max pointer tilt of the portal window, in degrees (around the Y and X axes). */
const TILT_Y = 37.4;
const TILT_X = -33;
/** The avatar stays put inside a square this much larger than the portal, so the window slides over it. */
const STAGE_SCALE = 1.35;

const pad = (n: number) => `[${String(n).padStart(2, '0')}]`;

/**
 * About: a cinematic layout borrowed from a "portal" landing page. A rounded window drawn on a
 * canvas opens in the centre, tilts toward the pointer while the photo behind it stays still, and
 * on click swallows the section before scrolling on to the next one. Section list on the left,
 * giant title bottom-left, facts bottom-right.
 */
export function AboutSection() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const portalRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const travelRef = useRef<() => void>(() => {});
  // No 2D canvas (very old browser, test DOM): show the plain photo and skip the entrance.
  const [flat] = useState(() => {
    try {
      return !document.createElement('canvas').getContext('2d');
    } catch {
      return true;
    }
  });
  const [revealed, setRevealed] = useState(flat);
  const [travelling, setTravelling] = useState(false);

  const links = t.nav.links;
  const index = Math.max(0, links.findIndex((l) => l.href === '#about'));
  const next = links[index + 1];
  const nextHref = next?.href;

  const facts: [string, string][] = [
    [t.about.educationLabel, t.about.educationSchool],
    [t.about.degreeLabel, t.about.educationDegree],
    [t.about.periodLabel, t.about.educationDates],
    [t.about.languagesLabel, t.about.languages],
  ];

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const portal = portalRef.current;
    const image = imageRef.current;
    const label = labelRef.current;
    if (!section || !canvas || !portal || !image || !label) return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }

    const s = {
      rotX: 0,
      rotY: 0,
      targetX: 0,
      targetY: 0,
      mask: reduced ? 1 : 0,
      expansion: 0,
      busy: false,
      visible: false,
      revealed: false,
      labelX: 0,
      labelY: 0,
      pointerX: 0,
      pointerY: 0,
      radius: 90,
      width: 0,
      height: 0,
    };
    let raf = 0;
    let last = 0;
    let disposed = false;
    /** Canvas area painted by the last frame (CSS px), cleared before the next one. */
    let dirty: { x: number; y: number; w: number; h: number } | null = null;


    const resize = () => {
      s.width = section.clientWidth;
      s.height = section.clientHeight;
      s.radius = parseFloat(getComputedStyle(portal).borderTopLeftRadius) || 90;
      if (!ctx) return;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(s.width * d);
      canvas.height = Math.round(s.height * d);
      canvas.style.width = `${s.width}px`;
      canvas.style.height = `${s.height}px`;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };

    const draw = (now: number) => {
      raf = 0;
      if (!ctx || disposed) return;
      const dt = Math.min(40, last ? now - last : 16);
      last = now;
      const k = Math.min(1, dt * 0.009);
      s.rotX += (s.targetX - s.rotX) * k;
      s.rotY += (s.targetY - s.rotY) * k;
      s.labelX += (s.pointerX - s.labelX) * 0.2;
      s.labelY += (s.pointerY - s.labelY) * 0.2;

      const W = s.width;
      const H = s.height;
      // Layout reads first, then this frame's style write: never a forced synchronous restyle.
      const sr = section.getBoundingClientRect();
      const pr = portal.getBoundingClientRect();
      label.style.transform = `translate3d(${s.labelX.toFixed(1)}px, ${s.labelY.toFixed(1)}px, 0)`;

      // Only the window drawn last frame needs clearing, not the whole section-sized canvas.
      if (dirty) ctx.clearRect(dirty.x, dirty.y, dirty.w, dirty.h);
      dirty = null;
      const rcx = pr.left - sr.left + pr.width / 2;
      const rcy = pr.top - sr.top + pr.height / 2;
      const e = s.expansion;
      const cx = rcx + (W / 2 - rcx) * e;
      const cy = rcy + (H / 2 - rcy) * e;
      const scale = e ? 1 : s.mask;
      const w = (pr.width + (W - pr.width) * e) * scale;
      const h = (pr.height + (H - pr.height) * e) * scale;

      if (w > 1 && h > 1) {
        const rx = s.rotX * (1 - e);
        const ry = s.rotY * (1 - e);
        const pts = roundedRectPoints(w, h, s.radius * (1 - e) * scale).map((p) =>
          project(p, rx, ry, cx, cy)
        );
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const [x, y] of pts) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        // Padded for the 1px outline and antialiasing.
        dirty = {
          x: Math.floor(minX) - 2,
          y: Math.floor(minY) - 2,
          w: Math.ceil(maxX - minX) + 5,
          h: Math.ceil(maxY - minY) + 5,
        };
        ctx.save();
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx!.lineTo(x, y) : ctx!.moveTo(x, y)));
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, W, H);

        if (image.complete && image.naturalWidth) {
          // The photo is locked to a stage around the portal's resting place, not to the window.
          const side = Math.max(pr.width, pr.height) * STAGE_SCALE;
          const sx = rcx - side / 2;
          const sy = rcy - side / 2;
          const box = coverRect(
            image.naturalWidth,
            image.naturalHeight,
            sx + (0 - sx) * e,
            sy + (0 - sy) * e,
            side + (W - side) * e,
            side + (H - side) * e
          );
          ctx.drawImage(image, box.x, box.y, box.w, box.h);
        }

        const shade = ctx.createLinearGradient(0, cy, 0, cy + h / 2);
        shade.addColorStop(0, 'rgba(0,0,0,0)');
        shade.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, cy, W, h / 2 + 2);
        ctx.restore();

        ctx.strokeStyle = 'rgba(244,241,234,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const settling =
        Math.abs(s.targetX - s.rotX) + Math.abs(s.targetY - s.rotY) > 0.01 ||
        Math.abs(s.pointerX - s.labelX) + Math.abs(s.pointerY - s.labelY) > 0.1;
      if (s.visible && (settling || s.busy || (s.revealed && s.mask < 1))) raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!raf && ctx && !disposed) {
        last = 0;
        raf = requestAnimationFrame(draw);
      }
    };

    const reveal = () => {
      if (s.revealed) return;
      s.revealed = true;
      setRevealed(true);
      if (reduced) {
        kick();
        return;
      }
      kick();
      if (ctx) sfx.play('swell', { intensity: 0.5, source: 'auto' });
      void animateValue((v) => {
        s.mask = v;
        kick();
      }, 1050);
    };

    const onMove = (ev: PointerEvent) => {
      const sr = section.getBoundingClientRect();
      s.pointerX = ev.clientX - sr.left;
      s.pointerY = ev.clientY - sr.top;
      if (!reduced && !s.busy && ev.pointerType === 'mouse') {
        s.targetY = (s.pointerX / sr.width - 0.5) * TILT_Y;
        s.targetX = (s.pointerY / sr.height - 0.5) * TILT_X;
      }
      kick();
    };
    const onLeave = () => {
      s.targetX = 0;
      s.targetY = 0;
      kick();
    };
    // A low, inviting hum when the mouse finds the portal (at most every 600 ms).
    let lastHum = -Infinity;
    const onPortalEnter = (ev: PointerEvent) => {
      section.classList.add('is-entering');
      if (!s.busy && ev.pointerType === 'mouse' && performance.now() - lastHum > 600) {
        lastHum = performance.now();
        sfx.play('tick', { step: -5, intensity: 0.4 });
      }
    };
    const onPortalLeave = () => section.classList.remove('is-entering');

    travelRef.current = () => {
      if (s.busy || !nextHref) return;
      const target = document.querySelector(nextHref);
      if (reduced || !ctx) {
        sfx.suppressAuto(1500);
        sfx.play('tap');
        target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
      s.busy = true;
      sfx.play('riser', { intensity: 1 });
      sfx.play('whoosh', { intensity: 1 });
      s.targetX = 0;
      s.targetY = 0;
      setTravelling(true);
      kick();
      void animateValue((v) => {
        s.expansion = v;
        kick();
      }, 900).then(() => {
        // Sections passed on the way down stay quiet.
        sfx.suppressAuto(1500);
        sfx.play('impact', { intensity: 0.7 });
        target?.scrollIntoView({ behavior: 'smooth' });
        window.setTimeout(() => {
          if (disposed) return;
          s.expansion = 0;
          s.busy = false;
          setTravelling(false);
          kick();
        }, 900);
      });
    };

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => (resize(), kick())) : null;
    ro?.observe(section);
    const io = new IntersectionObserver(
      ([entry]) => {
        s.visible = entry.isIntersecting;
        if (entry.intersectionRatio >= 0.3) reveal();
        if (s.visible) kick();
      },
      { threshold: [0, 0.3] }
    );
    io.observe(section);
    image.addEventListener('load', kick);
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    portal.addEventListener('pointerenter', onPortalEnter);
    portal.addEventListener('pointerleave', onPortalLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io.disconnect();
      image.removeEventListener('load', kick);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      portal.removeEventListener('pointerenter', onPortalEnter);
      portal.removeEventListener('pointerleave', onPortalLeave);
    };
  }, [nextHref]);

  const sectionClass = [
    'about noise-overlay',
    flat ? 'about--flat' : '',
    revealed ? 'is-revealed' : '',
    travelling ? 'is-travelling' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section id="about" ref={sectionRef} aria-labelledby="about-heading" className={sectionClass}>
      <div className="about-ambient" aria-hidden="true" style={{ backgroundImage: `url(${avatarUrl})` }} />
      <div className="about-shade" aria-hidden="true" />
      <canvas ref={canvasRef} className="about-canvas" aria-hidden="true" />

      <nav className="about-list about-chrome" aria-label={t.about.label}>
        {links.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            className={`about-list-item${i === index ? ' active' : ''}`}
            aria-current={i === index ? 'true' : undefined}
            data-sfx-hover="off"
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') sfx.play('tick', { step: i, intensity: 0.45 });
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="about-intro about-chrome">
        <p className="about-eyebrow">
          {pad(index + 1)} — {t.about.label}
        </p>
        <h2 id="about-heading" className="text-2xl md:text-4xl font-serif text-ink leading-tight mb-5">
          <WordsPullUp text={t.about.heading} />
        </h2>
        <p className="text-white/70 text-sm md:text-[15px] leading-relaxed">
          {t.about.paragraphPlain}{' '}
          <em className="font-serif italic text-primary">{t.about.paragraphItalic}</em>
          {t.about.paragraphPlainEnd}
        </p>
      </div>

      <div className="about-portal-wrap about-chrome">
        {next && (
          <div className="about-portal-heading">
            <span>{t.about.nextLabel}</span>
            <span>
              {pad(index + 2)} <strong>{next.label}</strong>
            </span>
          </div>
        )}
        <button
          ref={portalRef}
          type="button"
          className="about-portal"
          aria-label={next ? `${t.about.nextLabel} ${next.label}` : t.about.label}
          data-sfx="off"
          data-sfx-hover="off"
          onClick={() => travelRef.current()}
        >
          <img ref={imageRef} src={avatarUrl} alt="Nguyễn Ngọc Tuyền" />
        </button>
      </div>

      <div className="about-bottom about-chrome">
        <p className="about-title" aria-hidden="true">
          {t.about.title.toUpperCase()}
        </p>
        <dl className="about-facts">
          {facts.map(([key, value]) => (
            <div key={key} className="about-fact">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <span ref={labelRef} className="about-enter-label" aria-hidden="true">
        {t.about.enterLabel}
      </span>
    </section>
  );
}
