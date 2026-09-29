import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface WordsPullUpProps {
  text: string;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
  /** Skip the scroll-triggered reveal and animate immediately on mount. Use for above-the-fold text. */
  eager?: boolean;
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
}: WordsPullUpProps) {
  const ref = useRef(null);
  const scrollInView = useInView(ref, { once: true, margin: '-100px' });
  const isInView = eager || scrollInView;
  const words = splitWords(text);

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="contents">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="overflow-hidden inline-block mr-[0.25em] pb-1">
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
