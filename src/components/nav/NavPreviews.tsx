import { useMemo, type CSSProperties } from 'react';
import { useLang } from '../../context/LangContext';
import { collectShots, fibonacciSphere } from '../archive/sphere';
import { TechIcon, hoverColor } from '../ui/techIcons';

const RADIUS = 124;
const CARD_W = 50;

/**
 * Pocket version of the project archive: every screenshot on a slowly turning CSS sphere.
 * Static layout, spin is a CSS animation that only runs while the preview is showing.
 * Images are mounted once `armed` so the dropdown costs nothing until someone opens it.
 */
export function NavSphere({ armed }: { armed: boolean }) {
  const { t } = useLang();
  const projects = t.projects.items;
  const shots = useMemo(() => collectShots(projects), [projects]);
  const points = useMemo(() => fibonacciSphere(shots.length), [shots.length]);

  return (
    <>
      <div className="dd-orb-stage">
        <div className="dd-orb-world">
          {shots.map((shot, i) => {
            const p = points[i];
            const h = shot.tall ? CARD_W * 1.3 : CARD_W / 1.6;
            return (
              <span
                key={shot.key}
                className="dd-orb-card"
                style={{
                  width: CARD_W,
                  height: h,
                  marginLeft: -CARD_W / 2,
                  marginTop: -h / 2,
                  transform:
                    `translate3d(${(p.x * RADIUS).toFixed(1)}px, ${(-p.y * RADIUS).toFixed(1)}px, ${(p.z * RADIUS).toFixed(1)}px) ` +
                    `rotateY(${p.lon.toFixed(2)}deg) rotateX(${p.lat.toFixed(2)}deg)`,
                }}
              >
                {armed && (
                  <img
                    src={shot.thumb}
                    alt=""
                    decoding="async"
                    draggable={false}
                    onLoad={(e) => e.currentTarget.classList.add('in')}
                  />
                )}
              </span>
            );
          })}
        </div>
      </div>
      <p className="dd-scene-caption">
        {shots.length} {t.archive.shots} · {projects.length} {t.archive.projects}
      </p>
    </>
  );
}

/** Pocket version of the skills stage: giant serif title over the core stack laid on an arch. */
export function NavStackArch() {
  const { t } = useLang();
  const s = t.skills;
  const last = s.core.length - 1;

  return (
    <>
      <div className="dd-arch-floor" />
      <p className="dd-arch-title">{s.heading}</p>
      <ul className="dd-arch">
        {s.core.map((name, i) => {
          const angle = Math.PI * (1 - i / last);
          return (
            <li
              key={name}
              style={
                {
                  '--brand': hoverColor(name),
                  '--i': i,
                  left: `${50 + Math.cos(angle) * 42}%`,
                  bottom: `${9 + Math.sin(angle) * 58}%`,
                } as CSSProperties
              }
            >
              <span className="dd-arch-icon">
                <TechIcon name={name} size={15} />
              </span>
              <span className="dd-arch-name">{name}</span>
            </li>
          );
        })}
      </ul>
      <div className="dd-arch-centre">
        <p>{s.coreLabel}</p>
        <ul>
          {s.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
