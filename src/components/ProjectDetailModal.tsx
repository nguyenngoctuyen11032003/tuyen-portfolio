import type { ReactNode } from 'react';
import { ArrowUpRight, Globe } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { Modal } from './ui/Modal';
import { TechTag } from './ui/TechTag';
import { TechIcon } from './ui/techIcons';
import { ProjectGallery } from './ui/ProjectGallery';
import type { ProjectItem } from '../data/content';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  /** Screenshot to open the gallery on. */
  initialImage?: number;
  onClose: () => void;
}

const LINK_CLASS =
  'liquid-glass rounded-full px-4 py-2 text-sm text-white/80 inline-flex items-center gap-1.5 hover:scale-105 transition-transform';

/** Project details with screenshots, highlights and links; shared by the project cards and the 3D archive. */
export function ProjectDetailModal({ project, initialImage = 0, onClose }: ProjectDetailModalProps) {
  const { t } = useLang();

  function externalLink(href: string, label: string, icon?: ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} — ${project?.title} (${t.a11y.openInNewTab})`}
        className={LINK_CLASS}
      >
        {icon}
        {label}
        <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    );
  }

  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      title={project?.title ?? ''}
      size={project?.images?.length ? 'lg' : 'md'}
    >
      {project && (
        <>
          {project.images && project.images.length > 0 && (
            <div className="pt-8 md:pt-6">
              <ProjectGallery
                key={`${project.title}-${initialImage}`}
                images={project.images}
                initialIndex={initialImage}
                labels={{
                  prev: t.projects.prevImage,
                  next: t.projects.nextImage,
                  show: t.projects.showImage,
                }}
              />
            </div>
          )}
          <p className="type-label text-white/45 mb-3">
            {project.role} · {project.scope}
          </p>
          <h3 className="type-h3 text-ink mb-4">{project.title}</h3>
          <p className="type-small text-white/55 mb-4">{project.years}</p>
          {project.description && (
            <p className="type-body text-white/70 mb-4">{project.description}</p>
          )}
          {project.highlights && project.highlights.length > 0 && (
            <ul className="space-y-2 mb-5 list-none p-0">
              {project.highlights.map((item) => (
                <li key={item} className="type-body flex gap-3 text-white/65">
                  <span className="mt-[0.7em] h-1 w-1 rounded-full bg-emerald-300/80 flex-shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <TechTag key={tag} name={tag} size="md" />
              ))}
            </div>
          )}
          {(project.liveUrl || project.repoUrl || project.caseStudyUrl) && (
            <div className="flex flex-wrap gap-3 mt-5">
              {project.liveUrl && externalLink(project.liveUrl, t.projects.liveLabel, <Globe size={14} aria-hidden="true" />)}
              {project.repoUrl && externalLink(project.repoUrl, t.projects.repoLabel, <TechIcon name="GitHub" size={14} />)}
              {project.caseStudyUrl && externalLink(project.caseStudyUrl, t.projects.caseStudyLabel)}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
