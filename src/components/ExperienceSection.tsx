import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';

export function ExperienceSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="experience" aria-labelledby="experience-heading" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-3xl mx-auto" ref={ref}>
        <h2 id="experience-heading" className="text-3xl md:text-5xl font-serif text-ink mb-16 text-center">
          <WordsPullUp text={t.experience.heading} />
        </h2>

        <div className="relative pl-8 md:pl-10">
          <div className="absolute left-[7px] md:left-[9px] top-2 bottom-2 w-px bg-white/10" />

          {t.experience.items.map((item, i) => (
            <motion.div
              key={item.period + item.org}
              className="relative pb-12 last:pb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute -left-8 md:-left-10 top-1 liquid-glass rounded-full w-4 h-4 md:w-[18px] md:h-[18px]">
                {i === 0 && <span className="absolute inset-[3px] rounded-full bg-primary" />}
              </div>
              <p
                className={`text-xs tracking-widest uppercase mb-2 ${
                  i === 0 ? 'text-primary' : 'text-white/40'
                }`}
              >
                {item.period}
              </p>
              <h3 className="text-ink text-lg md:text-xl font-medium">
                {item.role} · {item.org}
              </h3>
              <p className="text-white/60 text-sm mt-1">{item.focus}</p>

              {item.achievements && item.achievements.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {item.achievements.map((achievement) => (
                    <li key={achievement} className="text-white/60 text-sm flex gap-2">
                      <span className="text-primary mt-1">–</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="liquid-glass rounded-full px-3 py-1 text-xs text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
