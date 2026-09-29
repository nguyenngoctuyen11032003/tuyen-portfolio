import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Code2,
  ClipboardList,
  ShieldCheck,
  Languages,
  Layout,
  Server,
  Database,
  GitBranch,
} from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { TiltCard } from './ui/TiltCard';
import { SurfaceCard } from './ui/SurfaceCard';
import type { SkillGroup } from '../data/content';

const ICONS: Record<SkillGroup['icon'], typeof Code2> = {
  code: Code2,
  'clipboard-list': ClipboardList,
  shield: ShieldCheck,
  languages: Languages,
};

const TECH_CATEGORIES = [
  { label: 'Frontend', icon: Layout },
  { label: 'Backend', icon: Server },
  { label: 'Database', icon: Database },
  { label: 'DevOps', icon: GitBranch },
  { label: 'Security', icon: ShieldCheck },
];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {t.skills.groups.map((group, i) => {
            const Icon = ICONS[group.icon];
            return (
              <motion.div
                key={group.title}
                className={i === 0 ? 'sm:col-span-2' : ''}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <TiltCard>
                  <SurfaceCard className="p-6 md:p-8 h-full">
                    <div className="liquid-glass rounded-full w-11 h-11 flex items-center justify-center mb-4">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="text-ink text-lg font-medium mb-2">{group.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{group.description}</p>
                  </SurfaceCard>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TECH_CATEGORIES.map(({ label, icon: Icon }, i) => (
            <motion.div
              key={label}
              className="surface-card flex flex-col items-center gap-2 py-5"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon size={20} className="text-primary" />
              <span className="text-white/60 text-xs">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
