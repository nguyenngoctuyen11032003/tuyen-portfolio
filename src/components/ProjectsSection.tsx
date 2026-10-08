import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { TechTag } from './ui/TechTag';
import { ProjectDetailModal } from './ProjectDetailModal';
import { splitAccent } from './hero/text';
import { mediumOf, thumbOf } from '../data/thumbs';
import { useScrollScale } from '../hooks/useScrollScale';
import { sfx } from '../sound';
import type { ProjectItem } from '../data/content';

const EASE = [0.25, 0.1, 0.25, 1] as const;
const STAGE_INTERVAL = 5200; // auto-advance of the featured stage, ms
const CROSSFADE = 1000; // matches the CSS opacity transition; clicks during it are ignored

/** Bento column spans on the 12-column grid, alternating 7/5 then 5/7 so rows interlock. */
export function bentoSpans(count: number): (7 | 5)[] {
  return Array.from({ length: count }, (_, i) => ([7, 5, 5, 7] as const)[i % 4]);
}

/** "2024 — 2026": the span of years across all projects. */
export function yearSpan(items: ProjectItem[]): string {
  const years = items.flatMap((p) => (p.years.match(/\d{4}/g) ?? []).map(Number));
  if (years.length === 0) return '';
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min} — ${max}`;
}

/** Corner each bento card grows from while scrolling in: toward the gutter between the pair. */
export function bentoOrigins(count: number): string[] {
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? 'right bottom' : 'left bottom'));
}

interface FeaturedStageProps {
  project: ProjectItem;
  onOpen: (imageIndex: number) => void;
}

/**
 * Cinematic card for the lead project: its screenshots crossfade full-bleed behind the text with
 * a slow bob, and a row of numbered switches picks the shot. Auto-advances while on screen.
 */
function FeaturedStage({ project, onOpen }: FeaturedStageProps) {
  const { t } = useLang();
  const images = project.images ?? [];
  const [active, setActive] = useState(0);
  const coolingRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);

  const show = useCallback(
    (index: number, user = false) => {
      if (coolingRef.current || index === active) return;
      // Only a picked shot sounds; the auto-advance stays silent.
      if (user) {
        sfx.play('tick', { step: index + 2, intensity: 0.7 });
        sfx.play('slide', { intensity: 0.5, pan: Math.sign(index - active) * 0.3 });
      }
      coolingRef.current = true;
      setActive(index);
      window.setTimeout(() => {
        coolingRef.current = false;
      }, CROSSFADE);
    },
    [active]
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || paused || !visible || images.length < 2) return;
    const id = window.setTimeout(() => show((active + 1) % images.length), STAGE_INTERVAL);
    return () => window.clearTimeout(id);
  }, [active, paused, visible, images.length, show]);

  return (
    <div
      ref={stageRef}
      className="stage"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="stage-media" aria-hidden="true">
        {images.map((image, i) => (
          <img
            key={image.src}
            src={mediumOf(image.src)}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`stage-shot ${i === active ? 'is-active' : ''}`}
          />
        ))}
        <div className="stage-shade" />
      </div>

      <div className="stage-content">
        <span className="liquid-glass stage-badge">
          <span className="stage-dot" />
          {t.projects.featuredLabel} · {project.scope}
        </span>
        <h3 className="stage-title">{project.title}</h3>
        <p className="stage-meta">
          {project.role} · {project.years}
        </p>
        {project.description && <p className="stage-text">{project.description}</p>}
        {project.tags && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <TechTag key={tag} name={tag} />
            ))}
          </div>
        )}
        <div className="stage-actions">
          <button
            type="button"
            className="stage-cta"
            data-sfx="off"
            onClick={() => onOpen(active)}
            aria-label={`${t.projects.detailsLabel} ${project.title}`}
          >
            {t.projects.detailsLabel}
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </div>

        {images.length > 1 && (
          <div className="stage-switcher">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                data-sfx="off"
                onClick={() => show(i, true)}
                aria-label={`${project.title}: ${i + 1}/${images.length} — ${image.alt}`}
                aria-pressed={i === active}
                className={i === active ? 'is-active' : ''}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
            <span className="stage-caption" aria-live="polite">
              {images[active]?.alt}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface BentoCardProps {
  project: ProjectItem;
  span: 7 | 5;
  origin: string;
  onOpen: () => void;
}

/** Bento tile: halftone-screened cover, a blur + "View — Title" pill on hover, details below. */
function BentoCard({ project, span, origin, onOpen }: BentoCardProps) {
  const { t } = useLang();
  const cover = project.images?.[0];

  return (
    <li className={span === 7 ? 'md:col-span-7' : 'md:col-span-5'}>
      <div data-scroll-scale data-origin={origin} className="h-full will-change-transform">
        <article
          className="bento-card group"
          data-sfx-hover="off"
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') sfx.play('hover', { intensity: 0.8, rate: 0.85, pan: sfx.panAt(e.clientX) });
          }}
        >
          <div className="bento-media">
            {cover ? (
              <img
                src={thumbOf(cover.src)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(52,211,153,0.2),transparent_60%)]" />
            )}
            <div className="bento-halftone" aria-hidden="true" />
            {project.images && project.images.length > 1 && (
              <span className="bento-count" aria-hidden="true">
                {project.images.length} {t.projects.screenshotsLabel}
              </span>
            )}
            <div className="bento-hover" aria-hidden="true">
              <span className="bento-pill">
                <span className="bento-pill-inner">
                  {t.projects.viewLabel} — <em>{project.title}</em>
                </span>
              </span>
            </div>
          </div>

          <div className="bento-body">
            <p className="text-white/40 text-[11px] tracking-[0.22em] uppercase">
              {project.scope} · {project.years}
            </p>
            <h3 className="mt-2 text-ink text-xl md:text-2xl font-medium tracking-tight">{project.title}</h3>
            {project.description && (
              <p className="mt-2 text-white/55 text-sm leading-relaxed line-clamp-2">{project.description}</p>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {project.tags.slice(0, 5).map((tag) => (
                  <TechTag key={tag} name={tag} />
                ))}
              </div>
            )}
          </div>

          {/* Stretched button: the whole tile opens the project. */}
          <button
            type="button"
            onClick={onOpen}
            className="bento-hit"
            data-sfx="off"
            aria-label={`${t.projects.detailsLabel} ${project.title}`}
          />
        </article>
      </div>
    </li>
  );
}

export function ProjectsSection() {
  const { t } = useLang();
  const gridRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<{ project: ProjectItem; image: number } | null>(null);
  const [lead, ...rest] = t.projects.items;
  const spans = bentoSpans(rest.length);
  const origins = bentoOrigins(rest.length);
  useScrollScale(gridRef);

  const [before, accent, after] = splitAccent(t.projects.heading, t.projects.headingAccent);

  return (
    <section id="projects" aria-labelledby="projects-heading" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-6xl mx-auto">
        <motion.header
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: EASE }}
          onViewportEnter={() => sfx.play('reveal', { intensity: 0.5, source: 'auto' })}
        >
          <div>
            <p className="flex items-center gap-3 text-white/45 text-xs uppercase tracking-[0.3em] mb-5">
              <span className="block w-8 h-px bg-white/25" aria-hidden="true" />
              {t.projects.eyebrow}
            </p>
            <h2 id="projects-heading" className="text-4xl md:text-6xl text-ink tracking-tight leading-[1.02]">
              {before} {accent && <em className="font-serif italic font-normal text-primary">{accent}</em>}
              {after && ` ${after}`}
            </h2>
            <p className="mt-4 text-white/55 text-sm md:text-base max-w-md">{t.projects.intro}</p>
          </div>
          <a href="#archive" className="gradient-ring-btn hidden md:inline-flex" data-sfx="press">
            <span>
              {t.projects.archiveLink}
              <ArrowRight size={15} aria-hidden="true" />
            </span>
          </a>
        </motion.header>

        {lead && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: EASE }}
            className="mb-5 md:mb-6"
          >
            <FeaturedStage project={lead} onOpen={(image) => setOpen({ project: lead, image })} />
          </motion.div>
        )}

        <ul ref={gridRef} className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 list-none p-0">
          {rest.map((project, i) => (
            <BentoCard
              key={project.title}
              project={project}
              span={spans[i]}
              origin={origins[i]}
              onOpen={() => setOpen({ project, image: 0 })}
            />
          ))}
        </ul>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-['Space_Mono',monospace] text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-white/45">
          <p>{t.projects.also}</p>
          <p className="text-white/30">
            {t.projects.items.length} {t.archive.projects} · {yearSpan(t.projects.items)}
          </p>
        </div>
      </div>

      <ProjectDetailModal project={open?.project ?? null} initialImage={open?.image ?? 0} onClose={() => setOpen(null)} />
    </section>
  );
}
