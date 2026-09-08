import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Mail, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { WordsPullUp } from './ui/WordsPullUp';
import { PillButton } from './ui/PillButton';

export function splitAccent(headline: string, accent: string): [string, string, string] {
  const idx = headline.indexOf(accent);
  if (idx === -1) return [headline, '', ''];
  return [headline.slice(0, idx).trim(), accent, headline.slice(idx + accent.length).trim()];
}

function useParticleAurora(canvasRef: React.RefObject<HTMLCanvasElement>) {
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
    function render() {
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
      gradient.addColorStop(0, 'rgba(222, 219, 200, 0.08)');
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
        ctx.fillStyle = 'rgba(222, 219, 200, 0.5)';
        ctx.fill();
      });

      raf = requestAnimationFrame(render);
    }
    render();

    function handleResize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
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
    if (!layer) return;

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

  return (
    <section id="hero" className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      <div ref={layerRef} className="absolute inset-0 scale-110">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center gap-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-tight max-w-4xl text-[#E1E0CC]">
          <WordsPullUp text={before} />
          {accent && <WordsPullUp text={accent} wordClassName="italic" />}
          {after && <WordsPullUp text={after} />}
        </h1>

        <p className="text-white/60 text-sm md:text-base max-w-lg">{t.hero.subheading}</p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <PillButton href="#projects" variant="solid">
            {t.hero.ctaProjects}
          </PillButton>
          <PillButton href="#contact" variant="glass" className="inline-flex items-center gap-2">
            {t.hero.ctaContact}
            <ArrowRight size={16} />
          </PillButton>
        </div>
      </div>

      <div className="relative z-10 flex justify-center pb-10">
        <a
          href={`mailto:${t.contact.email}`}
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white transition-colors"
          aria-label="Email"
        >
          <Mail size={20} />
        </a>
      </div>
    </section>
  );
}
