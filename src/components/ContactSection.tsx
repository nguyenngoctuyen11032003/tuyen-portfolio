import { Mail, MapPin, ArrowUp, ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { links } from '../data/content';
import { WordsPullUp } from './ui/WordsPullUp';
import { PillButton } from './ui/PillButton';
import { TechIcon } from './ui/techIcons';

export function ContactSection() {
  const { t } = useLang();

  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-black pt-24 pb-10 px-6 noise-overlay">
      <div className="max-w-3xl mx-auto text-center">
        <h2 id="contact-heading" className="text-4xl md:text-6xl font-serif italic text-primary mb-10 leading-tight">
          <WordsPullUp text={t.contact.heading} />
        </h2>

        <PillButton
          href={`mailto:${t.contact.email}`}
          variant="solid"
          className="inline-flex items-center gap-2 mb-10"
        >
          <Mail size={16} />
          {t.contact.ctaLabel}
        </PillButton>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-white/50 text-sm">
          <a href={`mailto:${t.contact.email}`} className="flex items-center gap-2 hover:text-white/80">
            <Mail size={14} /> {t.contact.email}
          </a>
          <span className="flex items-center gap-2">
            <MapPin size={14} /> {t.contact.location}
          </span>
          <a
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.contact.githubLabel} (${t.a11y.openInNewTab})`}
            className="flex items-center gap-1.5 hover:text-white/80"
          >
            {t.contact.githubLabel} <TechIcon name="GitHub" size={14} />
          </a>
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.contact.linkedinLabel} (${t.a11y.openInNewTab})`}
            className="flex items-center gap-1.5 hover:text-white/80"
          >
            {t.contact.linkedinLabel} <ArrowUpRight size={14} />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-16 pt-8 border-t border-white/10">
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Nguyễn Ngọc Tuyền</p>
          <a
            href="#hero"
            className="liquid-glass rounded-full p-2.5 text-white/60 hover:text-white transition-colors"
            aria-label={t.a11y.backToTop}
          >
            <ArrowUp size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
