import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';

const GRADIENT_POSITIONS = ['30% 20%', '80% 15%', '20% 80%', '85% 75%'];

export function ProjectsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="projects" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 className="text-3xl md:text-5xl font-serif text-[#E1E0CC] mb-16 text-center">
          <WordsPullUp text={t.projects.heading} />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {t.projects.items.map((project, i) => (
            <motion.div
              key={project.title}
              className="group liquid-glass rounded-3xl overflow-hidden p-6 md:p-8 relative"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-105"
                style={{
                  background: `radial-gradient(circle at ${GRADIENT_POSITIONS[i % GRADIENT_POSITIONS.length]}, rgba(222,219,200,0.15), transparent 60%)`,
                }}
              />
              <div className="relative">
                <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
                  {project.role} · {project.scope}
                </p>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[#E1E0CC] text-xl md:text-2xl font-medium tracking-tight">
                    {project.title}
                  </h3>
                  <span className="liquid-glass rounded-full p-2 flex-shrink-0">
                    <ArrowUpRight size={16} className="text-white/80" />
                  </span>
                </div>
                <p className="text-white/50 text-sm mt-3">{project.years}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
