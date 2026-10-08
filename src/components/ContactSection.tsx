import { useEffect, useRef } from 'react';
import { Mail, MapPin, ArrowUp, ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { links } from '../data/content';
import { WordsPullUp } from './ui/WordsPullUp';
import { TechIcon } from './ui/techIcons';

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
    const frame = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const { overlay, pill, footer } = outroStages(travel > 0 ? -rect.top / travel : 1);
      const next = `${overlay.toFixed(3)}|${pill.toFixed(3)}|${footer.toFixed(3)}`;
      if (next === written) return;
      written = next;
      section.style.setProperty('--overlay', overlay.toFixed(3));
      section.style.setProperty('--pill', pill.toFixed(3));
      section.style.setProperty('--foot', footer.toFixed(3));
    };
    const schedule = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
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

        <a href={`mailto:${t.contact.email}`} className="outro-pill">
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
