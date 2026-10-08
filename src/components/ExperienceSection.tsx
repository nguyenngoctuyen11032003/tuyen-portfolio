import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { useLang } from '../context/LangContext';
import { splitAccent } from './hero/text';
import { TechTag } from './ui/TechTag';
import { sfx, milestone } from '../sound';
import type { Content, ExperienceItem } from '../data/content';

const EASE = [0.16, 1, 0.3, 1] as const;
const DATE = /(\d{2})\/(\d{4})/g;

const monthIndex = (date: string) => {
  const [m, y] = date.split('/').map(Number);
  return y * 12 + (m - 1);
};

/** Whether a period like "07/2025 – nay" has no end date. */
export function isOngoing(period: string): boolean {
  return (period.match(DATE) ?? []).length === 1;
}

/** Inclusive month count of "MM/YYYY – MM/YYYY"; an open-ended period runs to `now`. */
export function monthsInPeriod(period: string, now = new Date()): number {
  const [start, end] = period.match(DATE) ?? [];
  if (!start) return 0;
  const last = end ? monthIndex(end) : now.getFullYear() * 12 + now.getMonth();
  return Math.max(1, last - monthIndex(start) + 1);
}

/** "1 năm 4 tháng" / "1 yr 4 mos". */
export function formatDuration(months: number, units: Content['experience']['units']): string {
  const part = (n: number, [one, many]: [string, string]) => `${n} ${n === 1 ? one : many}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 && part(years, units.year), rest > 0 && part(rest, units.month)].filter(Boolean).join(' ');
}

/** [first year, last year] across the timeline; an ongoing role extends it to `now`. */
export function careerSpan(items: ExperienceItem[], now = new Date()): [number, number] {
  const years = items.flatMap((item) => (item.period.match(/\d{4}/g) ?? []).map(Number));
  if (items.some((item) => isOngoing(item.period))) years.push(now.getFullYear());
  return [Math.min(...years), Math.max(...years)];
}

const pad = (n: number) => String(n).padStart(2, '0');

function trackSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
}

interface EntryProps {
  item: ExperienceItem;
  index: number;
  reached: boolean;
  onActive: (index: number) => void;
}

function ExperienceEntry({ item, index, reached, onActive }: EntryProps) {
  const { t } = useLang();
  const ref = useRef<HTMLLIElement>(null);
  // Counts as "active" while the entry crosses the middle band of the viewport.
  const centred = useInView(ref, { margin: '-45% 0px -45% 0px' });
  const live = index === 0 && isOngoing(item.period);
  const duration = formatDuration(monthsInPeriod(item.period), t.experience.units);

  useEffect(() => {
    if (centred) onActive(index);
  }, [centred, index, onActive]);

  return (
    <motion.li
      ref={ref}
      id={`exp-${index}`}
      className="exp-entry"
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <span className={`exp-node${reached ? ' is-on' : ''}${live ? ' is-live' : ''}`} aria-hidden="true" />

      <article
        className={`exp-card${live ? ' is-current' : ''}`}
        onMouseMove={trackSpotlight}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') sfx.play('hover', { intensity: 0.6, pan: sfx.panAt(e.clientX) });
        }}
      >
        <span className="exp-num" aria-hidden="true">
          {pad(index + 1)}
        </span>

        <div className="exp-meta">
          <p className={`exp-period${live ? ' text-primary' : ''}`}>{item.period}</p>
          {duration && <span className="exp-chip">{duration}</span>}
          {live && (
            <span className="exp-live">
              <span className="exp-live-dot" aria-hidden="true" />
              {t.experience.currentLabel}
            </span>
          )}
        </div>

        <h3 className={`exp-role${live ? ' is-lead' : ''}`}>{item.role}</h3>
        <p className="exp-org">{item.org}</p>
        <p className="exp-focus">{item.focus}</p>

        {item.achievements && item.achievements.length > 0 && (
          <ol className="exp-wins">
            {item.achievements.map((achievement, i) => (
              <motion.li
                key={achievement}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: EASE }}
              >
                <span className="exp-wins-num" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <span>{achievement}</span>
              </motion.li>
            ))}
          </ol>
        )}

        {item.tags && item.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-6" aria-label="Tech stack">
            {item.tags.map((tag, i) => (
              <motion.li
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.05, ease: EASE }}
              >
                <TechTag name={tag} size="md" />
              </motion.li>
            ))}
          </ul>
        )}
      </article>
    </motion.li>
  );
}

export function ExperienceSection() {
  const { t } = useLang();
  const { items } = t.experience;
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [before, accent] = splitAccent(t.experience.heading, t.experience.headingAccent);
  const [from, to] = careerSpan(items);

  // The rail fills top-down as the list scrolls past the upper third of the viewport.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 65%', 'end 65%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  // The head rides a track-tall rail moved by translateY (a % of its own height, i.e. the track's),
  // so following the scroll never re-lays out the list the way animating `top` would.
  const headY = useTransform(fill, (v) => `${v * 100}%`);

  // A soft chime when the rail fills to the end; re-arms once it drops back below 90%.
  const railDone = useRef(milestone(0.995, 0.9));
  useEffect(() => {
    railDone.current.sync(fill.get());
  }, [fill]);
  useMotionValueEvent(fill, 'change', (v) => {
    if (railDone.current.update(v)) sfx.play('chime', { intensity: 0.4, source: 'auto' });
  });

  // Timeline nodes light up with a rising tick scrolling down and a low one scrolling back up.
  // Debounced so a fast scroll past several entries only sounds where it settles.
  const prevActive = useRef<number | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const prev = prevActive.current;
      prevActive.current = active;
      if (prev === null || prev === active) return;
      if (active > prev) sfx.play('tick', { step: active + 2, intensity: 0.6, source: 'auto' });
      else sfx.play('tick', { step: active, intensity: 0.3, rate: 0.5, source: 'auto' });
    }, 150);
    return () => window.clearTimeout(id);
  }, [active]);

  // The gradient on the career span repaints every frame, so it only runs while on screen.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => section.classList.toggle('is-live', entry.isIntersecting));
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="experience"
      ref={sectionRef}
      aria-labelledby="experience-heading"
      className="exp bg-black py-24 md:py-36 px-6 noise-overlay"
    >
      <div className="exp-glow" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-12 gap-14 lg:gap-16">
        <motion.header
          className="lg:col-span-5 lg:sticky lg:top-28 self-start"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: EASE }}
          onViewportEnter={() => sfx.play('reveal', { intensity: 0.5, source: 'auto' })}
        >
          <p className="flex items-center gap-3 text-white/45 text-xs uppercase tracking-[0.3em] mb-6">
            <span className="block w-8 h-px bg-white/25" aria-hidden="true" />
            {t.experience.eyebrow}
          </p>
          <h2 id="experience-heading" className="text-5xl md:text-7xl text-ink tracking-tight leading-[0.95]">
            {before}{' '}
            {accent && <em className="block font-serif italic font-normal text-primary">{accent}</em>}
          </h2>
          <p className="mt-6 text-white/55 text-sm md:text-base leading-relaxed max-w-sm">{t.experience.intro}</p>

          <div className="exp-span" aria-hidden="true">
            <span className="exp-span-from">{from}</span>
            <span className="exp-span-dash" />
            <span className="exp-span-to">{to}</span>
          </div>
          <p className="exp-mono text-white/40">
            {pad(items.length)} {t.experience.companiesLabel}
          </p>

          <nav className="exp-index" aria-label={t.experience.eyebrow}>
            {items.map((item, i) => (
              <a key={item.period} href={`#exp-${i}`} className={i === active ? 'is-active' : undefined}>
                <span>{pad(i + 1)}</span>
                <i aria-hidden="true" />
                <span>{item.period.match(/\d{4}/)?.[0]}</span>
              </a>
            ))}
          </nav>
        </motion.header>

        <ol ref={listRef} className="exp-list lg:col-span-7">
          <span className="exp-track" aria-hidden="true">
            <motion.span className="exp-fill" style={{ scaleY: fill }} />
            <motion.span className="exp-head-rail" style={{ y: headY }}>
              <span className="exp-head" />
            </motion.span>
          </span>

          {items.map((item, i) => (
            <ExperienceEntry
              key={item.period + item.org}
              item={item}
              index={i}
              reached={i <= active}
              onActive={setActive}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}
