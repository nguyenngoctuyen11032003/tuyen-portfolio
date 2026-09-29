import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { LangToggle } from './ui/LangToggle';
import { PillButton } from './ui/PillButton';

export function Navbar() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sections = t.nav.links
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHref(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [t.nav.links]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl">
      <div
        className={`liquid-glass rounded-full px-4 py-2.5 md:px-6 flex items-center justify-between transition-colors duration-300 ${
          scrolled ? 'bg-black/70' : ''
        }`}
      >
        <span className="font-serif italic text-2xl font-semibold tracking-tight text-primary">NNT</span>

        <div className="hidden md:flex items-center gap-6">
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeHref === link.href ? 'true' : undefined}
              className={`text-sm font-medium transition-colors ${
                activeHref === link.href ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LangToggle />
          <PillButton href="#contact" variant="solid">
            {t.nav.contactCta}
          </PillButton>
        </div>

        <button
          type="button"
          className="md:hidden text-white"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={t.a11y.toggleMenu}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="liquid-glass-strong bg-black/90 mt-2 rounded-2xl px-4 py-4 flex flex-col gap-3 md:hidden">
          {t.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeHref === link.href ? 'true' : undefined}
              className={`text-sm font-medium ${activeHref === link.href ? 'text-white' : 'text-white/80'}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center justify-between pt-2">
            <LangToggle />
            <PillButton href="#contact" variant="solid">
              {t.nav.contactCta}
            </PillButton>
          </div>
        </div>
      )}
    </nav>
  );
}
