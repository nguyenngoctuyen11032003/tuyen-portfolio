import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Code2, ClipboardList, ShieldCheck, Languages } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { TiltCard } from './ui/TiltCard';
import type { SkillGroup } from '../data/content';

const ICONS: Record<SkillGroup['icon'], typeof Code2> = {
  code: Code2,
  'clipboard-list': ClipboardList,
  shield: ShieldCheck,
  languages: Languages,
};

export function SkillsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 className="text-3xl md:text-5xl font-serif text-primary mb-16 text-center">
          <WordsPullUp text={t.skills.heading} />
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {t.skills.groups.map((group, i) => {
            const Icon = ICONS[group.icon];
            return (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <TiltCard className="liquid-glass rounded-3xl p-6 md:p-8 bg-[#212121]">
                  <div className="liquid-glass rounded-full w-11 h-11 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="text-primary text-lg font-medium mb-2">{group.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{group.description}</p>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
