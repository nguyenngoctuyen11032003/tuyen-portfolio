import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight, Globe, Images } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { TiltCard } from './ui/TiltCard';
import { SurfaceCard } from './ui/SurfaceCard';
import { Modal } from './ui/Modal';
import { TechTag } from './ui/TechTag';
import { TechIcon } from './ui/techIcons';
import { ProjectGallery } from './ui/ProjectGallery';
import type { ProjectItem } from '../data/content';

const GRADIENT_POSITIONS = ['30% 20%', '80% 15%', '20% 80%', '85% 75%'];

interface CoverProps {
  project: ProjectItem;
  featured: boolean;
  label: string;
  countLabel: string;
  onOpen: () => void;
}

/** Screenshot preview on a project card; the featured card shows a second shot stacked behind. */
function ProjectCover({ project, featured, label, countLabel, onOpen }: CoverProps) {
  const images = project.images ?? [];
  const [first, second] = images;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label} ${project.title}`}
      className={`relative block w-full text-left ${featured ? 'md:pt-4 md:pr-4' : ''}`}
    >
      {featured && second && (
        <img
          src={second.src}
          alt=""
          loading="lazy"
          className="hidden md:block absolute top-0 right-0 w-[88%] aspect-[16/10] object-cover object-top rounded-xl border border-white/10 opacity-60 rotate-[2.5deg] transition-transform duration-700 group-hover:rotate-[4deg] group-hover:translate-x-1"
        />
      )}
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-black shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
        <img
          src={first.src}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-2.5 py-1 text-[11px] text-white/85 inline-flex items-center gap-1.5">
          <Images size={12} aria-hidden="true" />
          {images.length} {countLabel}
        </span>
      </div>
    </button>
  );
}

const hasShots = (p?: ProjectItem) => (p?.images?.length ?? 0) > 0;

/**
 * Which cards span both grid columns: the first card, a card with screenshots that would
 * otherwise share its row with a card without any, and a last card left alone in its row.
 */
export function computeWideCards(items: ProjectItem[]): boolean[] {
  let column = 0;
  return items.map((project, i) => {
    const next = items[i + 1];
    const isWide =
      i === 0 || (column === 0 && (!next || (hasShots(project) && !hasShots(next))));
    column = isWide ? 0 : 1 - column;
    return isWide;
  });
}

export function ProjectsSection() {
  const { t } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const items = t.projects.items;
  const wide = computeWideCards(items);

  return (
    <section id="projects" aria-labelledby="projects-heading" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <h2 id="projects-heading" className="text-3xl md:text-5xl font-serif text-ink mb-16 text-center">
          <WordsPullUp text={t.projects.heading} />
        </h2>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 list-none p-0">
          {items.map((project, i) => {
            const hasImages = (project.images?.length ?? 0) > 0;
            // Full-row cards with screenshots put the cover beside the text instead of above it.
            const featured = wide[i] && hasImages;
            const cover = hasImages && (
              <ProjectCover
                project={project}
                featured={featured}
                label={t.projects.galleryLabel}
                countLabel={t.projects.screenshotsLabel}
                onOpen={() => setActiveProject(project)}
              />
            );

            return (
              <motion.li
                key={project.title}
                className={wide[i] ? 'md:col-span-2' : ''}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <TiltCard className="group h-full">
                  <SurfaceCard className={`overflow-hidden h-full ${featured ? 'p-6 md:p-10' : 'p-6 md:p-8'}`}>
                    <div
                      className="absolute inset-0 opacity-40 transition-transform duration-700 group-hover:scale-105"
                      style={{
                        background: `radial-gradient(circle at ${GRADIENT_POSITIONS[i % GRADIENT_POSITIONS.length]}, rgba(52,211,153,0.18), transparent 60%)`,
                      }}
                    />
                    <div
                      className={`relative ${
                        featured && hasImages ? 'md:grid md:grid-cols-[1fr_1.25fr] md:gap-10 md:items-center' : ''
                      }`}
                    >
                      {!featured && cover && <div className="mb-6">{cover}</div>}
                      <div>
                        <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
                          {project.role} · {project.scope}
                        </p>
                        <div className="flex items-start justify-between gap-4">
                          <h3
                            className={`text-ink font-medium tracking-tight ${
                              featured ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
                            }`}
                          >
                            {project.title}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setActiveProject(project)}
                            className="liquid-glass rounded-full p-2 flex-shrink-0 hover:scale-110 transition-transform"
                            aria-label={`${t.projects.detailsLabel} ${project.title}`}
                          >
                            <ArrowUpRight size={16} className="text-white/80" />
                          </button>
                        </div>
                        <p className="text-white/50 text-sm mt-3">{project.years}</p>
                        {project.description && (
                          <p className={`text-white/60 text-sm mt-3 ${featured ? 'line-clamp-3' : 'line-clamp-2'}`}>
                            {project.description}
                          </p>
                        )}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {project.tags.slice(0, 5).map((tag) => (
                              <TechTag key={tag} name={tag} />
                            ))}
                          </div>
                        )}
                      </div>
                      {featured && cover && <div className="mt-8 md:mt-0">{cover}</div>}
                    </div>
                  </SurfaceCard>
                </TiltCard>
              </motion.li>
            );
          })}
        </ul>

        <p className="text-white/50 text-sm text-center mt-10">{t.projects.also}</p>
      </div>

      <Modal
        open={activeProject !== null}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title ?? ''}
        size={activeProject?.images?.length ? 'lg' : 'md'}
      >
        {activeProject && (
          <>
            {activeProject.images && activeProject.images.length > 0 && (
              <div className="pt-8 md:pt-6">
                <ProjectGallery
                  key={activeProject.title}
                  images={activeProject.images}
                  labels={{
                    prev: t.projects.prevImage,
                    next: t.projects.nextImage,
                    show: t.projects.showImage,
                  }}
                />
              </div>
            )}
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">
              {activeProject.role} · {activeProject.scope}
            </p>
            <h3 className="text-ink text-2xl font-serif mb-4">{activeProject.title}</h3>
            <p className="text-white/50 text-sm mb-4">{activeProject.years}</p>
            {activeProject.description && (
              <p className="text-white/70 text-sm leading-relaxed mb-4">{activeProject.description}</p>
            )}
            {activeProject.highlights && activeProject.highlights.length > 0 && (
              <ul className="space-y-2 mb-5 list-none p-0">
                {activeProject.highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-white/65 text-sm leading-relaxed">
                    <span className="mt-2 h-1 w-1 rounded-full bg-emerald-300/80 flex-shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {activeProject.tags && activeProject.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeProject.tags.map((tag) => (
                  <TechTag key={tag} name={tag} size="md" />
                ))}
              </div>
            )}
            {(activeProject.liveUrl || activeProject.repoUrl || activeProject.caseStudyUrl) && (
              <div className="flex flex-wrap gap-3 mt-5">
                {activeProject.liveUrl && (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t.projects.liveLabel} — ${activeProject.title} (${t.a11y.openInNewTab})`}
                    className="liquid-glass rounded-full px-4 py-2 text-sm text-white/80 inline-flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    <Globe size={14} aria-hidden="true" />
                    {t.projects.liveLabel}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                )}
                {activeProject.repoUrl && (
                  <a
                    href={activeProject.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t.projects.repoLabel} — ${activeProject.title} (${t.a11y.openInNewTab})`}
                    className="liquid-glass rounded-full px-4 py-2 text-sm text-white/80 inline-flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    <TechIcon name="GitHub" size={14} />
                    {t.projects.repoLabel}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                )}
                {activeProject.caseStudyUrl && (
                  <a
                    href={activeProject.caseStudyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t.projects.caseStudyLabel} — ${activeProject.title} (${t.a11y.openInNewTab})`}
                    className="liquid-glass rounded-full px-4 py-2 text-sm text-white/80 inline-flex items-center gap-1.5 hover:scale-105 transition-transform"
                  >
                    {t.projects.caseStudyLabel}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </section>
  );
}
