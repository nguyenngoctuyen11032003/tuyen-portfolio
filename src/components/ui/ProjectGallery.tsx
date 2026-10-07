import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProjectImage } from '../../data/content';
import { thumbOf } from '../../data/thumbs';

interface ProjectGalleryProps {
  images: ProjectImage[];
  labels: { prev: string; next: string; show: string };
  /** Screenshot shown first, e.g. the one clicked in the 3D archive. */
  initialIndex?: number;
}

/** Screenshot viewer for the project modal: main image, arrow/keyboard navigation and thumbnails. */
export function ProjectGallery({ images, labels, initialIndex = 0 }: ProjectGalleryProps) {
  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), images.length - 1));
  const count = images.length;
  const current = images[index];

  useEffect(() => {
    if (count < 2) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="mb-6">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={current.src}
            src={current.src}
            alt={current.alt}
            className="absolute inset-0 w-full h-full object-contain"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((index - 1 + count) % count)}
              className="absolute left-3 bg-black/60 backdrop-blur-sm border border-white/15 top-1/2 -translate-y-1/2 rounded-full p-2 hover:scale-110 transition-transform"
              aria-label={labels.prev}
            >
              <ChevronLeft size={18} className="text-white/90" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((index + 1) % count)}
              className="absolute right-3 top-1/2 bg-black/60 backdrop-blur-sm border border-white/15 -translate-y-1/2 rounded-full p-2 hover:scale-110 transition-transform"
              aria-label={labels.next}
            >
              <ChevronRight size={18} className="text-white/90" />
            </button>
            <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-2.5 py-1 text-[11px] text-white/80 tabular-nums">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      <p className="text-white/50 text-xs mt-2.5" aria-live="polite">
        {current.alt}
      </p>

      {count > 1 && (
        <ul className="flex gap-2 mt-3 overflow-x-auto pb-1 list-none p-0">
          {images.map((image, i) => (
            <li key={image.src} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${labels.show} ${i + 1}: ${image.alt}`}
                aria-current={i === index}
                className={`block w-24 md:w-28 aspect-video rounded-lg overflow-hidden border transition-all ${
                  i === index
                    ? 'border-emerald-300/70 opacity-100'
                    : 'border-white/10 opacity-50 hover:opacity-90'
                }`}
              >
                <img
                  src={thumbOf(image.src)}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
