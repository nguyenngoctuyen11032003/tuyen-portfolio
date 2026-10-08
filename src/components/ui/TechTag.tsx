import { TechIcon } from './techIcons';

export function TechTag({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const cls =
    size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1 text-sm gap-1.5';
  // Tags always sit on solid card or section backgrounds, where liquid-glass's backdrop blur has
  // nothing to blur, yet each one costs a compositor pass per frame while the page scrolls (dozens
  // of tags, some inside scroll-scaled cards). Keep the glass rim, drop the blur.
  return (
    <span
      className={`liquid-glass [backdrop-filter:none] [-webkit-backdrop-filter:none] rounded-full text-white/70 inline-flex items-center ${cls}`}
    >
      <TechIcon name={name} size={12} />
      {name}
    </span>
  );
}
