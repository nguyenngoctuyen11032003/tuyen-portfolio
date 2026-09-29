import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, ChevronDown, Download } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { links } from '../data/content';
import { WordsPullUp } from './ui/WordsPullUp';
import { PillButton } from './ui/PillButton';
import { TechIcon } from './ui/techIcons';

export function splitAccent(headline: string, accent: string): [string, string, string] {
  const idx = headline.indexOf(accent);
  if (idx === -1) return [headline, '', ''];
  return [headline.slice(0, idx).trim(), accent, headline.slice(idx + accent.length).trim()];
}

const TRAILING_PUNCTUATION = /^[.,!?;:]+$/;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useParticleAurora(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
    }));

    let raf = 0;
    function render(loop = true) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.3,
        height * 0.3,
        0,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      gradient.addColorStop(0, 'rgba(52, 211, 153, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(110, 231, 183, 0.6)';
        ctx.fill();
      });

      if (loop) raf = requestAnimationFrame(() => render(true));
    }
    const reduced = prefersReducedMotion();
    render(!reduced);

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      if (reduced) render(false);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasRef]);
}

export function HeroSection() {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useParticleAurora(canvasRef);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || prefersReducedMotion()) return;

    function handleMouseMove(e: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = ((e.clientX - cx) / cx) * 16;
      const y = ((e.clientY - cy) / cy) * 16;
      gsap.to(layer, { x, y, duration: 0.6, ease: 'power2.out' });
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [before, accent, after] = splitAccent(t.hero.headline, t.hero.accent);
  const isAfterPunctuationOnly = TRAILING_PUNCTUATION.test(after);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden bg-black"
    >
      <div ref={layerRef} className="absolute inset-0 scale-110">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center min-w-0 w-full px-6 md:px-16 lg:px-24 py-32 gap-8 max-w-6xl">
        <span className="liquid-glass inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {t.hero.badge}
        </span>

        <h1 className="min-w-0 max-w-full text-[clamp(2.25rem,5.5vw,4.5rem)] font-serif leading-[1.1] md:max-w-3xl text-ink">
          <WordsPullUp text={before} eager staggerDelay={0.05} />
          {accent && <WordsPullUp text={accent} wordClassName="italic text-primary" eager staggerDelay={0.05} />}
          {after &&
            (isAfterPunctuationOnly ? (
              <span className="italic text-primary">{after}</span>
            ) : (
              <WordsPullUp text={after} eager staggerDelay={0.05} />
            ))}
        </h1>

        <p className="text-white/60 text-sm md:text-base max-w-lg">{t.hero.subheading}</p>

        <div className="flex flex-wrap items-center gap-4">
          <PillButton href="#projects" variant="solid">
            {t.hero.ctaProjects}
          </PillButton>
          <PillButton
            href={links.cv}
            download
            variant="glass"
            className="inline-flex items-center gap-2"
          >
            <Download size={16} />
            {t.hero.ctaCv}
          </PillButton>
          <PillButton
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.hero.ctaGithub} (${t.a11y.openInNewTab})`}
            variant="glass"
            className="inline-flex items-center gap-2"
          >
            {t.hero.ctaGithub}
            <TechIcon name="GitHub" size={16} />
          </PillButton>
          <PillButton href="#contact" variant="glass" className="inline-flex items-center gap-2">
            {t.hero.ctaContact}
            <ArrowRight size={16} />
          </PillButton>
        </div>

        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-6 border-t border-white/10">
          {t.hero.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-serif text-ink">{stat.value}</p>
              <p className="text-white/50 text-xs md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <a
        href="#about"
        className="relative z-10 flex justify-center pb-10 text-white/50 hover:text-white transition-colors animate-bounce"
        aria-label={t.a11y.scrollDown}
      >
        <ChevronDown size={22} />
      </a>
    </section>
  );
}
