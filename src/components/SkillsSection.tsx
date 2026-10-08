import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, TransitionEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { TechIcon, hoverColor } from './ui/techIcons';
import { TECH_ICONS } from './ui/techIconData';
import { FOCUS_STOPS, SCROLL_LENGTH, VAR_TARGETS, computeFrame, lerp } from './skills/cinema';
import { archPositions } from './skills/arch';
import './skills/skills.css';

/** Secondary stack icons scattered over the two foreground slabs that part on scroll. */
const SLAB_LEFT = ['HTML5', 'CSS3', 'Dart', 'Android', 'Python'];
const SLAB_RIGHT = ['MySQL', 'Linux', 'Nginx', 'Firebase', 'JWT'];
/** Slider holds three copies of the groups; the middle copy is the real, accessible one. */
const SETS = 3;
/** Flat perspective floor: rays fanning out from the horizon, rows bunching toward it. */
const GRID_RAYS = Array.from({ length: 25 }, (_, i) => i - 12);
const GRID_ROWS = Array.from({ length: 9 }, (_, i) => Math.round(400 * Math.pow((i + 1) / 9, 2.2)));

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Skills: a cinematic pinned stage scrubbed by scroll (see skills/cinema.ts). The core stack sits
 * on an arch under a giant serif title, two panels tell the stack and security story, and the
 * skill groups arrive last as an infinite card slider.
 */
export function SkillsSection() {
  const { t } = useLang();
  const s = t.skills;
  // The arch box is 2.3:1 on desktop/tablet and 1.45:1 on phones (skills.css); CSS picks the set.
  const archSpots = archPositions(s.core.length, 2.3);
  const archSpotsPhone = archPositions(s.core.length, 1.45);
  const sectionRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const groups = s.categories;
  const count = groups.length;
  const total = new Set(groups.flatMap((g) => g.items)).size;
  const [active, setActive] = useState(count);
  const [jumping, setJumping] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let raf = 0;
    let visible = typeof IntersectionObserver === 'undefined';
    let initialized = false;
    let smooth = 0;
    let mx = 0;
    let my = 0;
    let targetMx = 0;
    let targetMy = 0;

    // Each property goes to the element(s) that read it, and only when its value changed.
    const targets: Record<string, HTMLElement[]> = {};
    for (const [key, selector] of Object.entries(VAR_TARGETS)) {
      targets[key] = Array.from(section.querySelectorAll<HTMLElement>(selector));
    }
    const written: Record<string, string> = {};
    const arch = section.querySelector<HTMLElement>('.tech-arch');

    const distance = () =>
      Math.min(
        Math.max(-section.getBoundingClientRect().top, 0),
        Math.max(0, section.offsetHeight - window.innerHeight)
      );

    const update = () => {
      raf = 0;
      const still = reduced?.matches ?? false;
      // All layout reads happen here, before this frame's writes.
      const target = distance();
      const archH = arch?.offsetHeight ?? 0;
      smooth = !initialized || still ? target : lerp(smooth, target, 0.14);
      initialized = true;
      if (Math.abs(smooth - target) < 0.08) smooth = target;
      mx = still ? 0 : lerp(mx, targetMx, 0.12);
      my = still ? 0 : lerp(my, targetMy, 0.12);

      const { vars, controlsReady } = computeFrame(smooth, mx, my, window.innerHeight, archH);
      for (const key in vars) {
        const value = vars[key];
        if (written[key] === value) continue;
        written[key] = value;
        const els = targets[key];
        if (els?.length) els.forEach((el) => el.style.setProperty(key, value));
        else section.style.setProperty(key, value);
      }
      controlsRef.current?.classList.toggle('is-ready', controlsReady);

      if (
        !still &&
        (Math.abs(smooth - target) > 0.08 ||
          Math.abs(mx - targetMx) > 0.001 ||
          Math.abs(my - targetMy) > 0.001)
      ) {
        tick();
      }
    };
    const tick = () => {
      if (!raf && visible) raf = requestAnimationFrame(update);
    };
    const onPointer = (e: PointerEvent) => {
      targetMx = e.clientX / window.innerWidth - 0.5;
      targetMy = e.clientY / window.innerHeight - 0.5;
      tick();
    };

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) {
              initialized = false;
              tick();
            }
          });
    observer?.observe(section);

    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    window.addEventListener('pointermove', onPointer, { passive: true });
    update();

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
      window.removeEventListener('pointermove', onPointer);
      cancelAnimationFrame(raf);
    };
  }, []);

  /** Elements that only show up deep in the timeline scroll the stage there when they get focus. */
  const scrollToStop = (stop: number) => () => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(window.scrollY - (top + stop)) > 200) {
      window.scrollTo({ top: top + stop, behavior: 'auto' });
    }
  };

  const jump = (index: number) => {
    setJumping(true);
    setActive(index);
    requestAnimationFrame(() => requestAnimationFrame(() => setJumping(false)));
  };
  const move = (dir: number) => setActive((i) => Math.min(SETS * count - 1, Math.max(0, i + dir)));
  const normalize = (e: TransitionEvent<HTMLUListElement>) => {
    if (e.target !== e.currentTarget) return;
    if (active >= count * 2) jump(active - count);
    else if (active < count) jump(active + count);
  };
  const onCardKey = (index: number) => (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActive(index);
    }
  };


  return (
    <section
      id="skills"
      ref={sectionRef}
      aria-labelledby="skills-heading"
      className="tech"
      style={{ '--scroll-length': `${SCROLL_LENGTH}px` } as CSSProperties}
    >
      <div className="tech-stage">
        <div className="tech-world">
          <div className="tech-sky" aria-hidden="true" />

          <div className="tech-back" aria-hidden="true">
            <div className="tech-glow">
              <i />
              <i />
            </div>
            {/* Sharp grid plus a pre-blurred twin; scroll crossfades them instead of animating a
                CSS blur, so neither layer repaints while it moves. */}
            {[false, true].map((soft) => (
              <svg
                key={soft ? 'soft' : 'sharp'}
                className={`tech-grid${soft ? ' is-soft' : ''}`}
                aria-hidden="true"
                viewBox="0 0 1000 400"
                preserveAspectRatio="none"
              >
                {soft && (
                  <filter id="tech-grid-soft" filterUnits="userSpaceOnUse" x="-60" y="-60" width="1120" height="520">
                    <feGaussianBlur stdDeviation="8 12" />
                  </filter>
                )}
                <g filter={soft ? 'url(#tech-grid-soft)' : undefined}>
                  {GRID_RAYS.map((k) => (
                    <line key={`r${k}`} x1={500 + k * 22} y1={0} x2={500 + k * 150} y2={400} />
                  ))}
                  {GRID_ROWS.map((y) => (
                    <line key={`h${y}`} x1={0} y1={y} x2={1000} y2={y} />
                  ))}
                </g>
              </svg>
            ))}
          </div>

          <div className="tech-shade" aria-hidden="true" />

          <h2 id="skills-heading" className="tech-title">
            {s.heading}
          </h2>

          <div className="tech-arch">
            <p className="tech-arch-label">{s.coreLabel}</p>
            <ul aria-label={s.coreLabel}>
              {s.core.map((name, i) => {
                const pos = archSpots[i];
                const phone = archSpotsPhone[i];
                return (
                  <li
                    key={name}
                    className="tech-tile"
                    style={
                      {
                        '--brand': hoverColor(name),
                        '--tile-left': `${pos.left}%`,
                        '--tile-bottom': `${pos.bottom}%`,
                        '--tile-left-phone': `${phone.left}%`,
                        '--tile-bottom-phone': `${phone.bottom}%`,
                      } as CSSProperties
                    }
                  >
                    <span className="tech-tile-icon">
                      <TechIcon name={name} size={30} />
                    </span>
                    <span className="tech-tile-name">{name}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="tech-core" aria-hidden="true">
            <TechIcon name="TypeScript" className="tech-core-mark" />
          </div>

          {[SLAB_LEFT, SLAB_RIGHT].map((icons, side) => (
            <div
              key={side}
              className={`tech-slab ${side ? 'tech-slab-right' : 'tech-slab-left'}`}
              aria-hidden="true"
            >
              {icons.map((name, i) => (
                <span key={name} className="tech-slab-icon" style={{ '--i': i } as CSSProperties}>
                  <TechIcon name={name} size={40} />
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="tech-intro">
          <p>{s.intro}</p>
          <ul className="tech-tags">
            {s.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>

        <div className="tech-panel tech-panel-stack">
          <h3>{s.stackTitle}</h3>
          <p>{s.stackText}</p>
          <dl className="tech-facts">
            <div>
              <dt>{total}</dt>
              <dd>{s.totalLabel}</dd>
            </div>
            <div>
              <dt>{pad(count)}</dt>
              <dd>{s.groupsLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="tech-panel tech-panel-security">
          <ShieldCheck className="tech-panel-shield" size={40} strokeWidth={1.4} aria-hidden="true" />
          <h3>{s.securityTitle}</h3>
          <p>{s.note}</p>
          <a className="tech-pill-link" href={s.securityCta.href} onFocus={scrollToStop(FOCUS_STOPS.security)}>
            <ArrowUpRight size={18} aria-hidden="true" />
            <span>{s.securityCta.label}</span>
          </a>
        </div>

        <div className="tech-slider" role="region" aria-labelledby="skills-groups">
          <p id="skills-groups" className="tech-slider-label">
            {s.sliderLabel}
          </p>
          <ul
            className={`tech-track${jumping ? ' is-jumping' : ''}`}
            style={{ '--active': active } as CSSProperties}
            onTransitionEnd={normalize}
          >
            {Array.from({ length: SETS * count }, (_, index) => {
              const group = groups[index % count];
              const real = Math.floor(index / count) === 1;
              const pin = group.items.find((item) => TECH_ICONS[item]);
              return (
                <li
                  key={index}
                  className={`tech-card${index === active ? ' is-active' : ''}`}
                  role="button"
                  tabIndex={real ? 0 : -1}
                  aria-hidden={real ? undefined : true}
                  aria-pressed={real ? index === active : undefined}
                  onClick={() => setActive(index)}
                  onKeyDown={onCardKey(index)}
                  onFocus={real ? scrollToStop(FOCUS_STOPS.slider) : undefined}
                >
                  <span className="tech-card-kicker">
                    {pad((index % count) + 1)} / {pad(count)} · {group.items.length} {s.itemsUnit}
                  </span>
                  {pin && (
                    <span className="tech-card-pin" style={{ '--brand': TECH_ICONS[pin].hex } as CSSProperties}>
                      <TechIcon name={pin} size={30} />
                    </span>
                  )}
                  <h3>{group.label}</h3>
                  <p>{group.items.join(' · ')}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="tech-controls" ref={controlsRef}>
          <button
            type="button"
            className="tech-nav"
            aria-label={s.prevLabel}
            onClick={() => move(-1)}
            onFocus={scrollToStop(FOCUS_STOPS.slider)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tech-nav"
            aria-label={s.nextLabel}
            onClick={() => move(1)}
            onFocus={scrollToStop(FOCUS_STOPS.slider)}
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
