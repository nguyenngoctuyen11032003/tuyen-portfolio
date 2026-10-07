import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../../context/LangContext';
import { rememberIntroShown } from '../../context/IntroContext';

interface BootLine {
  at: number; // ms after mount
  text: string;
  ok?: boolean;
  sub?: boolean;
}

const LEADER_WIDTH = 38;

/** "> LABEL ........ [OK]" with dot leaders padded to a fixed column. */
export function okLine(label: string): string {
  return `${label} ${'.'.repeat(Math.max(3, LEADER_WIDTH - label.length))}`;
}

export function bootLines(projectCount: number, shotCount: number): BootLine[] {
  return [
    { at: 0, text: 'SYSTEM BOOT SEQUENCE INITIATED' },
    { at: 260, text: okLine('LOADING KERNEL V3.2.1'), ok: true },
    { at: 480, text: okLine('CHECKING HARDWARE DEPENDENCIES'), ok: true },
    { at: 700, text: okLine('MOUNTING FILE SYSTEMS'), ok: true },
    { at: 920, text: okLine('INITIALIZING NETWORK INTERFACES'), ok: true },
    { at: 1180, text: okLine('LOADING PORTFOLIO ENGINE V1.0.0'), ok: true },
    { at: 1400, text: 'React + TypeScript + Vite + Tailwind CSS', sub: true },
    { at: 1560, text: 'Core stack: NestJS · Next.js · PostgreSQL · Redis', sub: true },
    { at: 1720, text: `Archive: ${projectCount} projects · ${shotCount} screenshots indexed`, sub: true },
    { at: 1980, text: okLine('RUNNING DIAGNOSTIC CHECKS'), ok: true },
    { at: 2260, text: okLine('SECURITY PROTOCOLS ACTIVE'), ok: true },
  ];
}

export const INTRO_TIMING = {
  access: 2900,
  sweep: 4600,
  complete: 5000,
  exit: 1.1, // seconds, played by the parent's AnimatePresence
};

const EASE = [0.22, 0.61, 0.36, 1] as const;

function AccessGranted() {
  return (
    <motion.div
      key="access"
      className="intro-access"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <span className="intro-hud intro-hud-tl" />
      <span className="intro-hud intro-hud-tr" />
      <span className="intro-hud intro-hud-bl" />
      <span className="intro-hud intro-hud-br" />

      <div className="intro-access-inner">
        <motion.span
          className="intro-rule"
          style={{ transformOrigin: 'left center' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.75, ease: EASE }}
        />
        <motion.h2
          className="intro-title intro-shimmer"
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
        >
          ACCESS GRANTED
        </motion.h2>
        <motion.p
          className="intro-subline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          AUTHENTICATION SUCCESSFUL — IDENTITY VERIFIED
        </motion.p>
        <motion.span
          className="intro-rule"
          style={{ transformOrigin: 'right center' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.75, ease: EASE }}
        />
      </div>
    </motion.div>
  );
}

interface CinematicIntroProps {
  onComplete: () => void;
}

/**
 * Full-screen opening: a terminal boot sequence, then "ACCESS GRANTED", a light sweep, and the
 * hand-off to the page. Purely decorative: nothing is checked or verified. The parent removes it
 * through AnimatePresence, which plays the fade/scale exit.
 */
export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const { t } = useLang();
  const lines = useMemo(() => {
    const projects = t.projects.items;
    const shots = projects.reduce((n, p) => n + (p.images?.length ?? 0), 0);
    return bootLines(projects.length, shots);
  }, [t.projects.items]);

  const [shown, setShown] = useState(0);
  const [scene, setScene] = useState<'boot' | 'access'>('boot');
  const [sweeping, setSweeping] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitingRef = useRef(false);

  const finish = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    rememberIntroShown();
    document.documentElement.style.overflow = '';
    onComplete();
  }, [onComplete]);

  // Lock page scroll while the intro covers it.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const timers = lines.map((line, i) => window.setTimeout(() => setShown(i + 1), line.at));
    timers.push(window.setTimeout(() => setScene('access'), INTRO_TIMING.access));
    timers.push(window.setTimeout(() => setSweeping(true), INTRO_TIMING.sweep));
    timers.push(window.setTimeout(finish, INTRO_TIMING.complete));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [lines, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  return (
    <motion.div
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
      style={{ pointerEvents: exiting ? 'none' : 'auto' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.07 }}
      transition={{ duration: INTRO_TIMING.exit, ease: EASE }}
    >
      <AnimatePresence>
        {scene === 'boot' ? (
          <motion.div
            key="boot"
            className="intro-boot"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="intro-terminal">
              <div className="intro-titlebar">
                <span className="intro-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>NNT.PORTFOLIO — BASH — 80×24</span>
              </div>
              <div className="intro-screen" aria-live="polite">
                {lines.slice(0, shown).map((line, i) => (
                  <motion.p
                    key={line.text}
                    className={line.sub ? 'intro-line is-sub' : 'intro-line'}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {!line.sub && <span className="intro-prompt">&gt; </span>}
                    {line.text}
                    {line.ok && <span className="intro-ok"> [OK]</span>}
                    {i === shown - 1 && <span className="intro-caret" aria-hidden="true" />}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <AccessGranted />
        )}
      </AnimatePresence>

      <div className="intro-scanlines" aria-hidden="true" />
      {sweeping && <span className="intro-sweep" aria-hidden="true" />}

      <button type="button" className="intro-skip" onClick={finish}>
        SKIP →
      </button>
    </motion.div>
  );
}
