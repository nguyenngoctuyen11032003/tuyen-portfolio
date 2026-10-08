import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Award, Cloud, ShieldCheck } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { SandTransition } from './ui/SandTransition';
import { sfx } from '../sound';
import type { CertificationItem } from '../data/content';

const CYCLE_MS = 5000;
const EASE = [0.16, 1, 0.3, 1] as const;

const pad = (n: number) => String(n).padStart(2, '0');

function Badge({ item }: { item: CertificationItem }) {
  if (item.badge) {
    return <img src={item.badge} alt={item.name} className="cert-badge-img" draggable={false} />;
  }
  // No official artwork: a typographic medal in the same spirit.
  return (
    <div className="cert-badge-fallback" role="img" aria-label={item.name}>
      <Award size={30} strokeWidth={1.25} aria-hidden="true" />
      <span>{item.short ?? item.name}</span>
    </div>
  );
}

/**
 * Certifications as a "collection": the badge on the left dissolves to sand and re-forms as the
 * list on the right steps through each certificate. Cycles on its own while visible until the
 * visitor picks one; hovering or focusing the panel pauses it.
 */
export function CertificationsSection() {
  const { t } = useLang();
  const c = t.certifications;
  const items = c.items;
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const current = items[active] ?? items[0];

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || picked || paused || !visible || items.length < 2) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % items.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [active, picked, paused, visible, items.length]);

  return (
    <section id="certifications" aria-labelledby="certifications-heading" className="cert-section">
      <div className="cert-head">
        <div>
          <h2 id="certifications-heading" className="cert-label">
            <span className="text-white/45">[ 07 ]</span> {c.heading}
          </h2>
          <motion.p
            className="cert-statement"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: EASE }}
            onViewportEnter={() => sfx.play('reveal', { intensity: 0.5, source: 'auto' })}
          >
            {c.statement[0]}
            <span className="cert-icons" aria-hidden="true">
              <span>
                <Cloud size={22} strokeWidth={1.5} />
              </span>
              <span>
                <ShieldCheck size={22} strokeWidth={1.5} />
              </span>
              <span>
                <Award size={22} strokeWidth={1.5} />
              </span>
            </span>
            {c.statement[1]}
          </motion.p>
        </div>
        <div className="cert-aside">
          <p className="cert-mono text-white/45">{c.tagline}</p>
          <ul className="flex flex-wrap gap-2 list-none p-0">
            {c.pills.map((pill) => (
              <li key={pill} className="cert-pill">
                {pill}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        ref={panelRef}
        className="cert-panel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="cert-stage">
          <span className="cert-stars" aria-hidden="true">
            * * *
          </span>
          <div className="cert-badge-slot">
            <AnimatePresence mode="wait">
              <SandTransition key={current.name} className="cert-badge">
                <Badge item={current} />
              </SandTransition>
            </AnimatePresence>
          </div>
          <p className="cert-counter cert-mono" aria-hidden="true">
            <span className="cert-counter-num">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={active}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {pad(active + 1)}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="text-white/20">/</span>
            <span>{pad(items.length)}</span>
          </p>
        </div>

        <div className="cert-list">
          <div className="cert-topbar cert-mono">
            <span>{c.topBar}</span>
            <span className="cert-counter-num">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={active}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {c.counterLabel} {pad(active + 1)}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <ol className="list-none p-0 m-0">
            {items.map((item, i) => {
              const isActive = i === active;
              return (
                <li key={item.name} className={`cert-item ${isActive ? 'is-active' : ''}`}>
                  <button
                    type="button"
                    className="cert-item-btn"
                    aria-expanded={isActive}
                    data-sfx="off"
                    onClick={() => {
                      if (i !== active) sfx.play('sand');
                      setActive(i);
                      setPicked(true);
                    }}
                  >
                    <span className="cert-item-name">{item.short ?? item.name}</span>
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, x: -8, y: 8 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          exit={{ opacity: 0, x: 8, y: -8 }}
                          transition={{ duration: 0.35 }}
                          className="text-white/50"
                          aria-hidden="true"
                        >
                          <ArrowUpRight size={22} strokeWidth={1} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="cert-details">
                          <p className="type-lead text-ink">{item.name}</p>
                          {(item.issuer || item.issued || item.validUntil) && (
                            <dl className="cert-facts cert-mono">
                              {item.issuer && (
                                <div>
                                  <dt className="sr-only">Issuer</dt>
                                  <dd>{item.issuer}</dd>
                                </div>
                              )}
                              {item.issued && (
                                <div>
                                  <dt>{c.issuedLabel}</dt>
                                  <dd>{item.issued}</dd>
                                </div>
                              )}
                              {item.validUntil && (
                                <div>
                                  <dt>{c.validLabel}</dt>
                                  <dd>{item.validUntil}</dd>
                                </div>
                              )}
                            </dl>
                          )}
                          {item.summary && <p className="type-body text-white/60">{item.summary}</p>}
                          {item.skills && item.skills.length > 0 && (
                            <div>
                              <p className="cert-mono text-white/45 mb-2">{c.skillsLabel}</p>
                              <ul className="flex flex-wrap gap-2 list-none p-0">
                                {item.skills.map((skill) => (
                                  <li key={skill} className="cert-skill">
                                    {skill}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.verifyUrl && (
                            <a
                              href={item.verifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${c.verifyLabel} — ${item.name} (${t.a11y.openInNewTab})`}
                              className="cert-verify"
                              data-sfx="off"
                              onClick={() => {
                                sfx.play('drop', { intensity: 0.7 });
                                sfx.play('chime', { delay: 70, intensity: 0.6 });
                              }}
                            >
                              <span className="cert-verify-fill" aria-hidden="true" />
                              <ShieldCheck size={16} aria-hidden="true" />
                              <span>{c.verifyLabel}</span>
                              <ArrowUpRight size={15} aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <p className="cert-footer cert-mono">{c.footer}</p>
    </section>
  );
}
