import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { TechIcon, hoverColor } from './ui/techIcons';

const EASE = [0.16, 1, 0.3, 1] as const;

export function SkillsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" aria-labelledby="skills-heading" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 id="skills-heading" className="text-3xl md:text-5xl font-serif text-ink mb-16 text-center">
          <WordsPullUp text={t.skills.heading} />
        </h2>

        <p className="text-white/40 text-xs uppercase tracking-widest mb-4">{t.skills.coreLabel}</p>
        <ul aria-label={t.skills.coreLabel} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-14">
          {t.skills.core.map((name, i) => (
            <motion.li
              key={name}
              className="group surface-card flex flex-col items-center justify-center gap-3 px-2 py-6 text-center"
              style={{ '--brand': hoverColor(name) } as CSSProperties}
              initial={{ opacity: 0, y: 24 }}
              whileHover={{ y: -4, transition: { duration: 0.2, delay: 0 } }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
            >
              <TechIcon
                name={name}
                size={32}
                className="text-white/60 transition-colors duration-300 group-hover:text-[var(--brand)]"
              />
              <span className="text-ink text-sm break-words max-w-full">{name}</span>
            </motion.li>
          ))}
        </ul>

        <ul className="divide-y divide-white/5 mb-10">
          {t.skills.categories.map((cat, i) => (
            <motion.li
              key={cat.label}
              className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 py-4"
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.06, ease: EASE }}
            >
              <h3 className="text-white/40 text-xs uppercase tracking-widest md:w-48 md:shrink-0 md:pt-2">
                {cat.label}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="liquid-glass rounded-full px-3 py-1.5 text-xs text-white/70 inline-flex items-center gap-1.5"
                  >
                    <TechIcon name={item} size={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ul>

        <p className="flex items-start gap-3 text-white/50 text-sm leading-relaxed max-w-2xl">
          <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <span>{t.skills.note}</span>
        </p>
      </div>
    </section>
  );
}
