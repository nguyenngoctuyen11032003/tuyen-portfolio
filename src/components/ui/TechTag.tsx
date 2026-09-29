import { TechIcon } from './techIcons';

export function TechTag({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const cls =
    size === 'sm' ? 'px-2.5 py-1 text-[11px] gap-1.5' : 'px-3 py-1 text-xs gap-1.5';
  return (
    <span className={`liquid-glass rounded-full text-white/70 inline-flex items-center ${cls}`}>
      <TechIcon name={name} size={12} />
      {name}
    </span>
  );
}
