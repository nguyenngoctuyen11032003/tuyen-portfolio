import { Mail, MapPin } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { PillButton } from './ui/PillButton';

export function ContactSection() {
  const { t } = useLang();

  return (
    <section id="contact" className="bg-black pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-serif italic text-[#E1E0CC] mb-10 leading-tight">
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/50 text-sm">
          <a href={`mailto:${t.contact.email}`} className="flex items-center gap-2 hover:text-white/80">
            <Mail size={14} /> {t.contact.email}
          </a>
          <span className="flex items-center gap-2">
            <MapPin size={14} /> {t.contact.location}
          </span>
        </div>

        <p className="text-white/20 text-xs mt-16">© {new Date().getFullYear()} Nguyễn Ngọc Tuyền</p>
      </div>
    </section>
  );
}
