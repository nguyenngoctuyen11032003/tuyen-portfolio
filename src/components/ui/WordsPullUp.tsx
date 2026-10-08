import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface WordsPullUpProps {
  text: string;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
  /** Skip the scroll-triggered reveal and animate immediately on mount. Use for above-the-fold text. */
  eager?: boolean;
  /** Keep the words hidden until this turns false (e.g. while an intro covers the page). */
  hold?: boolean;
}

export function splitWords(text: string): string[] {
  return text.split(' ').filter((word) => word.length > 0);
}

export function WordsPullUp({
  text,
  className = '',
  wordClassName = '',
  staggerDelay = 0.08,
  eager = false,
  hold = false,
}: WordsPullUpProps) {
  const ref = useRef(null);
  const scrollInView = useInView(ref, { once: true, margin: '-100px' });
  const isInView = !hold && (eager || scrollInView);
  const words = splitWords(text);

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="contents">
      {words.map((word, i) => (
        // The mask reaches above the cap height and below the descenders (negative margins keep the
        // line spacing) so Vietnamese marks such as ầ, ế and the dot in ụ are never clipped.
        <span
          key={`${word}-${i}`}
          className="overflow-hidden inline-block mr-[0.25em] pt-[0.3em] -mt-[0.3em] pb-[0.32em] -mb-[0.32em]"
        >
          <motion.span
            className={`inline-block ${wordClassName}`}
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: i * staggerDelay, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
      </span>
    </span>
  );
}
