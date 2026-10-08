import { useEffect, useRef } from 'react';
import { Mail, MapPin, ArrowUp, ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { links } from '../data/content';
import { WordsPullUp } from './ui/WordsPullUp';
import { TechIcon } from './ui/techIcons';
import { sfx, milestone } from '../sound';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Outro stages for a scroll progress 0..1 through the pinned contact section. */
export function outroStages(p: number) {
  return {
    overlay: smooth(clamp01((p - 0.05) / 0.5)),
    pill: 1 - Math.pow(1 - clamp01((p - 0.35) / 0.45), 3),
    footer: clamp01((p - 0.72) / 0.25),
  };
}

function useOutro(sectionRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    section.classList.add('is-scrubbed');

    // Scrubbed by scroll alone: one update per frame after a scroll or resize while on screen,
    // nothing at all while the page sits still.
    let raf = 0;
    let visible = false;
    let written = '';
    const overlayEl = section.querySelector<HTMLElement>('.outro-overlay');
    const pillEl = section.querySelector<HTMLElement>('.outro-pill');
    const footerEl = section.querySelector<HTMLElement>('.outro-footer');
    // One-shot sounds on the way down; each milestone re-arms below its lower threshold.
    const ms = {
      washStart: milestone(0.03, 0.01),
      washFull: milestone(0.97, 0.85),
      pillGrow: milestone(0.02, 0.005),
      pillLand: milestone(0.99, 0.6),
      footerIn: milestone(0.95, 0.5),
    };
    let lastP = -1;
    let synced = false;
    const frame = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel > 0 ? -rect.top / travel : 1;
      const { overlay, pill, footer } = outroStages(p);
      if (!synced) {
        // First frame on screen (deep link, reload mid-page, re-entry): adopt the state silently.
        ms.washStart.sync(overlay);
        ms.washFull.sync(overlay);
        ms.pillGrow.sync(pill);
        ms.pillLand.sync(pill);
        ms.footerIn.sync(footer);
        synced = true;
        lastP = p;
      } else {
        const forward = p > lastP;
        lastP = p;
        if (ms.washStart.update(overlay) && forward) sfx.play('swell', { intensity: 1, source: 'auto' });
        if (ms.washFull.update(overlay) && forward) sfx.play('reveal', { intensity: 0.7, source: 'auto' });
        if (ms.pillGrow.update(pill) && forward) {
          sfx.play('whoosh', { intensity: 0.6, rate: 0.7, pan: 0.4, source: 'auto' });
        }
        if (ms.pillLand.update(pill) && forward) {
          sfx.play('drop', { intensity: 1, pan: 0.3, source: 'auto' });
          sfx.play('chime', { delay: 60, pan: 0.3, source: 'auto' });
        }
        if (ms.footerIn.update(footer) && forward) {
          sfx.play('tick', { step: 0, rate: 0.5, intensity: 0.4, source: 'auto' });
        }
      }
      const next = `${overlay.toFixed(3)}|${pill.toFixed(3)}|${footer.toFixed(3)}`;
      if (next === written) return;
      written = next;
      // Written on the one element that reads each, so a frame restyles three nodes, not the section.
      (overlayEl ?? section).style.setProperty('--overlay', overlay.toFixed(3));
      (pillEl ?? section).style.setProperty('--pill', pill.toFixed(3));
      (footerEl ?? section).style.setProperty('--foot', footer.toFixed(3));
    };
    const schedule = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) synced = false;
      schedule();
    });
    observer.observe(section);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
      section.classList.remove('is-scrubbed');
    };
  }, [sectionRef]);
}

export function ContactSection() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  useOutro(sectionRef);

  return (
    <section id="contact" ref={sectionRef} aria-labelledby="contact-heading" className="outro">
      <div className="outro-pin">
        <div className="outro-overlay" aria-hidden="true" />

        <div className="outro-blend outro-top">
          <h2 id="contact-heading" className="outro-heading">
            <WordsPullUp text={t.contact.heading} />
          </h2>
          <div className="outro-meta">
            <a href={`mailto:${t.contact.email}`}>
              <Mail size={14} /> {t.contact.email}
            </a>
            <span>
              <MapPin size={14} /> {t.contact.location}
            </span>
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t.contact.githubLabel} (${t.a11y.openInNewTab})`}
            >
              {t.contact.githubLabel} <TechIcon name="GitHub" size={14} />
            </a>
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t.contact.linkedinLabel} (${t.a11y.openInNewTab})`}
            >
              {t.contact.linkedinLabel} <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <a href={`mailto:${t.contact.email}`} className="outro-pill" data-sfx="press">
          <span>{t.contact.ctaLabel}</span>
          <ArrowUpRight className="outro-pill-arrow" aria-hidden="true" />
        </a>

        <div className="outro-blend outro-footer">
          <p>© {new Date().getFullYear()} Nguyễn Ngọc Tuyền</p>
          <a href="#hero" aria-label={t.a11y.backToTop} className="outro-top-link">
            <ArrowUp size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
