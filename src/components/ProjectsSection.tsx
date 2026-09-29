import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { TiltCard } from './ui/TiltCard';
import { SurfaceCard } from './ui/SurfaceCard';
import { Modal } from './ui/Modal';
import type { ProjectItem } from '../data/content';

const GRADIENT_POSITIONS = ['30% 20%', '80% 15%', '20% 80%', '85% 75%'];

export function ProjectsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  return (
    <section id="projects" aria-labelledby="projects-heading" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 id="projects-heading" className="text-3xl md:text-5xl font-serif text-ink mb-16 text-center">
          <WordsPullUp text={t.projects.heading} />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {t.projects.items.map((project, i) => (
            <motion.div
              key={project.title}
              className={i === 0 ? 'md:col-span-2' : ''}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard className="group h-full">
                <SurfaceCard className={`overflow-hidden h-full ${i === 0 ? 'p-8 md:p-10' : 'p-6 md:p-8'}`}>
                  <div
                    className="absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-105"
                    style={{
                      background: `radial-gradient(circle at ${GRADIENT_POSITIONS[i % GRADIENT_POSITIONS.length]}, rgba(52,211,153,0.18), transparent 60%)`,
                    }}
                  />
                  <div className="relative">
                    <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
                      {project.role} · {project.scope}
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <h3
                        className={`text-ink font-medium tracking-tight ${
                          i === 0 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
                        }`}
                      >
                        {project.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveProject(project)}
                        className="liquid-glass rounded-full p-2 flex-shrink-0 hover:scale-110 transition-transform"
                        aria-label={`Xem chi tiết ${project.title}`}
                      >
                        <ArrowUpRight size={16} className="text-white/80" />
                      </button>
                    </div>
                    <p className="text-white/50 text-sm mt-3">{project.years}</p>
                  </div>
                </SurfaceCard>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal
        open={activeProject !== null}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title ?? ''}
      >
        {activeProject && (
          <>
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
              {activeProject.role} · {activeProject.scope}
            </p>
            <h3 className="text-ink text-2xl font-serif mb-4">{activeProject.title}</h3>
            <p className="text-white/50 text-sm mb-4">{activeProject.years}</p>
            {activeProject.description && (
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                {activeProject.description}
              </p>
            )}
            {activeProject.tags && activeProject.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="liquid-glass rounded-full px-3 py-1 text-xs text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </section>
  );
}
