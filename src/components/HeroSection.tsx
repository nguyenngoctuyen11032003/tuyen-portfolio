import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Download, MoveHorizontal, ShieldCheck } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useIntroDone } from '../context/IntroContext';
import { links } from '../data/content';
import { sfx } from '../sound';
import { STARS_A, STARS_B } from './hero/stars';
import { canRender3D } from './hero/webgl';
import { useHanoiTime } from './hero/useHanoiTime';
import { useHeroMotion } from './hero/useHeroMotion';
import { splitAccent, splitName, splitStat } from './hero/text';
import type { AvatarStage } from './hero/avatarStage';
import illustration from '../assets/hero-illustration.webp';
import illustration480 from '../assets/hero-illustration-480.webp';
import './hero/hero.css';

const TRAILING_PUNCTUATION = /^[.,!?;:]+$/;
const NBSP = String.fromCharCode(0xa0);
/** Glues an em dash to the word before it so a line never starts with "—". */
const keepDash = (text: string) => text.replace(/ —/g, `${NBSP}—`);
const COUNT_DELAY = 1250;
const COUNT_DURATION = 900;
const MODEL_URL = `${import.meta.env.BASE_URL}models/tuyen-avatar.glb`;

type FigureState = 'loading' | 'ready' | 'failed';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hero: the name set huge in Oswald (first word outlined), a one-line promise, credentials and
 * CTAs on the left; on the right a full-body 3D scan of Tuyền bleeding off the bottom of the frame,
 * turned by horizontal mouse travel. Without WebGL the illustrated portrait stands in.
 */
export function HeroSection() {
  const { t, lang } = useLang();
  const introDone = useIntroDone();
  const time = useHanoiTime(lang);

  const sectionRef = useRef<HTMLElement>(null);
  const starfieldRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarRef = useRef<AvatarStage | null>(null);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [motionRefs] = useState(() => ({
    section: sectionRef,
    starfield: starfieldRef,
    copy: copyRef,
    figure: figureRef,
  }));

  const [use3D] = useState(canRender3D);
  const [figure, setFigure] = useState<FigureState>(use3D ? 'loading' : 'failed');
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [settled, setSettled] = useState(false);
  // The avatar can finish loading under the intro; its sound waits for the entrance.
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useHeroMotion(motionRefs);

  // Entrance: wait for the cinematic intro, then start on the next frame.
  useEffect(() => {
    if (!introDone) return;
    const reduced = prefersReducedMotion();
    const start = window.setTimeout(
      () => {
        setReady(true);
        if (reduced) return;
        sfx.play('swell', { intensity: 0.7, source: 'auto' });
        // Lands with the emerald dot popping in after the name.
        sfx.play('tick', { step: 7, intensity: 0.6, delay: 1050, source: 'auto' });
      },
      reduced ? 0 : 120
    );
    const settle = window.setTimeout(() => setSettled(true), reduced ? 0 : 3200);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(settle);
    };
  }, [introDone]);

  // Count the stat numbers up once the entrance reaches them (values are the same in both
  // languages, so a language toggle does not replay it).
  const statValues = t.hero.stats.map((s) => s.value).join('|');
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const values = statValues.split('|').map((v) => splitStat(v)[0]);
    const els = statRefs.current;
    let raf = 0;
    let begin = 0;
    let done = false;
    // What each number showed last frame (the first frame shows 0).
    const lastShown = values.map(() => 0);
    const step = (now: number) => {
      begin ||= now;
      const p = Math.min(1, Math.max(0, (now - begin - COUNT_DELAY) / COUNT_DURATION));
      const eased = 1 - Math.pow(1 - p, 3);
      let changed = false;
      values.forEach((v, i) => {
        if (v === null) return;
        const shown = Math.round(v * eased);
        if (shown !== lastShown[i]) {
          lastShown[i] = shown;
          changed = true;
        }
        const el = els[i];
        if (el) el.textContent = String(shown);
      });
      // One tick per frame at most (the engine throttles further), climbing with progress.
      if (changed) sfx.play('tick', { step: Math.round(p * 4), intensity: 0.35, source: 'auto' });
      if (p >= 1 && !done) {
        done = true;
        sfx.play('chime', { intensity: 0.5, source: 'auto' });
      }
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      values.forEach((v, i) => {
        const el = els[i];
        if (el && v !== null) el.textContent = String(v);
      });
    };
  }, [ready, statValues]);

  // Start downloading the 3D figure straight away (it streams in while the intro plays).
  useEffect(() => {
    if (!use3D) return;
    const canvas = canvasRef.current;
    const container = stageRef.current;
    const section = sectionRef.current;
    if (!canvas || !container || !section) return;
    let cancelled = false;

    import('./hero/avatarStage')
      .then(({ mountAvatar, avatarMode }) => {
        if (cancelled) return;
        avatarRef.current = mountAvatar({
          canvas,
          container,
          section,
          url: MODEL_URL,
          mode: avatarMode(),
          // Download progress fires per network chunk; re-render the hero only when the shown
          // whole percent changes, so the intro playing on top never stutters under it.
          onProgress: (f) =>
            setProgress((p) => (f < 1 && Math.round(f * 100) === Math.round(p * 100) ? p : f)),
          onReady: () => {
            setFigure('ready');
            if (readyRef.current) sfx.play('reveal', { intensity: 0.6, source: 'auto' });
          },
          onError: () => setFigure('failed'),
        });
      })
      .catch(() => setFigure('failed'));

    return () => {
      cancelled = true;
      avatarRef.current?.dispose();
      avatarRef.current = null;
    };
  }, [use3D]);

  // Reveal the figure with the rest of the entrance.
  useEffect(() => {
    if (ready && figure === 'loading') avatarRef.current?.reveal();
  }, [ready, figure, progress]);

  const [first, rest] = splitName(t.hero.name);
  const [before, accent, after] = splitAccent(t.hero.headline, t.hero.accent);
  const afterIsPunctuation = TRAILING_PUNCTUATION.test(after);

  const sectionClass = [
    'hero',
    ready && 'is-ready',
    settled && 'is-settled',
    `is-figure-${figure}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section id="hero" ref={sectionRef} className={sectionClass} aria-labelledby="hero-name">
      <div className="hero-starfield" ref={starfieldRef} aria-hidden="true">
        <div className="hero-stars-a" style={{ boxShadow: STARS_A }} />
        <div className="hero-stars-b" style={{ boxShadow: STARS_B }} />
      </div>
      <div className="hero-horizon" aria-hidden="true" />

      <div className="hero-grid">
        <div className="hero-copy" ref={copyRef}>
          <div className="hero-head">
            <p className="hero-badge hero-anim">
              <span className="hero-badge-tile" aria-hidden="true">
                <ShieldCheck size={16} strokeWidth={2.25} />
              </span>
              <span>{t.hero.badge}</span>
            </p>

            <h1 id="hero-name" className="hero-name" lang={lang}>
              <span className="hero-name-mask">
                <span className="hero-name-line is-outline">{first}</span>
              </span>{' '}
              <span className="hero-name-mask">
                <span className="hero-name-line">{rest}</span>
                <span className="hero-name-dot" aria-hidden="true" />
              </span>
            </h1>
          </div>

          <div className="hero-body">
            <p className="hero-tagline hero-anim">
              {keepDash(before)} <em>{afterIsPunctuation ? `${accent}${after}` : accent}</em>
              {!afterIsPunctuation && after && `${after.startsWith('—') ? NBSP : ' '}${keepDash(after)}`}
            </p>
            <p className="hero-sub hero-anim">{t.hero.subheading}</p>
          </div>
        </div>

        <figure className="hero-figure" ref={figureRef}>
          <div className="hero-figure-glow" aria-hidden="true" />
          <div className="hero-figure-stage" ref={stageRef}>
            {use3D && (
              <canvas ref={canvasRef} className="hero-avatar" role="img" aria-label={t.hero.figureAlt} />
            )}
            {figure === 'failed' && (
              <img
                className="hero-fallback"
                src={illustration}
                srcSet={`${illustration480} 480w, ${illustration} 820w`}
                sizes="(min-width: 1024px) min(500px, 34vw), (min-width: 640px) 300px, calc(100vw - 32px)"
                width={820}
                height={1024}
                alt={t.hero.portraitAlt}
                loading="eager"
                decoding="async"
              />
            )}
          </div>
          {figure === 'loading' && (
            <span className="hero-loader" role="status">
              <span className="hero-loader-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
              {t.hero.loadingLabel} · {Math.round(progress * 100)}%
            </span>
          )}
          <span className="hero-chip">
            <i className="hero-chip-dot" aria-hidden="true" />
            <span>
              {t.hero.city} · <time dateTime={time.dateTime}>{time.label}</time>
            </span>
          </span>
          {figure === 'ready' && (
            <span className="hero-turn-hint" aria-hidden="true">
              <MoveHorizontal size={14} />
              {t.hero.turnHint}
            </span>
          )}
        </figure>

        <div className="hero-actions">
          <a href="#projects" className="hero-glow hero-anim" data-sfx="press">
            <span>{t.hero.ctaProjects}</span>
            <ArrowRight size={16} aria-hidden="true" />
            <span className="hero-glow-pool" aria-hidden="true" />
          </a>
          <a href={links.cv} download className="hero-ghost hero-anim">
            <Download size={16} aria-hidden="true" />
            <span>{t.hero.ctaCv}</span>
          </a>
          <a
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.hero.ctaGithub} (${t.a11y.openInNewTab})`}
            className="hero-link hero-anim"
          >
            {t.hero.ctaGithub}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <a href="#contact" className="hero-link hero-anim">
            {t.hero.ctaContact}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
          <span className="hero-rail" aria-hidden="true">
            <i className="hero-rail-packet" />
          </span>
          <a href="#about" className="hero-circle" aria-label={t.a11y.scrollDown}>
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>

        <dl className="hero-stats" aria-label={t.hero.statsLabel}>
          {t.hero.stats.map((stat, i) => {
            const [num, suffix] = splitStat(stat.value);
            return (
              <div key={i} className="hero-stat hero-anim">
                <dt>{stat.label}</dt>
                <dd>
                  {num === null ? (
                    stat.value
                  ) : (
                    <>
                      <span ref={(el) => void (statRefs.current[i] = el)}>{num}</span>
                      {suffix && <em>{suffix}</em>}
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
