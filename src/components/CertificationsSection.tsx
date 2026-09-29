import { Award } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { SurfaceCard } from './ui/SurfaceCard';

export function CertificationsSection() {
  const { t } = useLang();

  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="bg-black py-20 md:py-24 px-6 noise-overlay"
    >
      <div className="max-w-5xl mx-auto">
        <h2 id="certifications-heading" className="text-3xl md:text-4xl font-serif text-ink mb-12 text-center">
          <WordsPullUp text={t.certifications.heading} />
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
          {t.certifications.items.map((item) => (
            <li key={item.name}>
              <SurfaceCard className="p-5 h-full flex items-start gap-4">
                <Award size={22} className="text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-ink font-medium break-words">{item.name}</p>
                  {item.issuer && <p className="text-white/50 text-sm mt-1">{item.issuer}</p>}
                </div>
              </SurfaceCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
