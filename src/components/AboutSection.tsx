import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import avatarUrl from '../assets/avatar.jpg';

export function AboutSection() {
  const { t } = useLang();

  return (
    <section id="about" className="bg-black py-24 md:py-32 px-6 noise-overlay">
      <div className="max-w-5xl mx-auto bg-[#101010] rounded-3xl p-8 md:p-14 flex flex-col md:flex-row gap-10 md:gap-16 items-center">
        <div className="liquid-glass rounded-3xl overflow-hidden w-40 h-40 md:w-56 md:h-56 flex-shrink-0">
          <img src={avatarUrl} alt="Nguyễn Ngọc Tuyền" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-left">
          <p className="text-white/40 text-xs tracking-widest uppercase mb-4">{t.about.label}</p>
          <h2 className="text-3xl md:text-5xl font-serif text-[#E1E0CC] mb-6 leading-tight">
            <WordsPullUp text={t.about.heading} />
          </h2>
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8">
            {t.about.paragraphPlain}{' '}
            <em className="font-serif italic text-[#DEDBC8]">{t.about.paragraphItalic}</em>
            {t.about.paragraphPlainEnd}
          </p>

          <div className="border-t border-white/10 pt-6">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-2">
              {t.about.educationLabel}
            </p>
            <p className="text-[#E1E0CC] text-sm md:text-base font-medium">
              {t.about.educationSchool}
            </p>
            <p className="text-white/60 text-sm">
              {t.about.educationDegree} · {t.about.educationDates}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
