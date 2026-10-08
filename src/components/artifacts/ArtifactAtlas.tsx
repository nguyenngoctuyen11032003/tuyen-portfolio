import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useLang } from '../../context/LangContext';
import { sfx } from '../../sound';
import eagleImg from '../../assets/artifacts/dau-dai-bang.webp';
import boatImg from '../../assets/artifacts/thuyen-buom.webp';
import { Icon, IconSprite } from './icons';
import { lensPosition } from './math';
import type { ArtifactStage, LightMode, LoadState } from './stage';
import './atlas.css';

/** Per-artifact 3D and image setup, in the same order as `t.artifacts.items`. */
const MODELS = [
  {
    url: '/dau-dai-bang.glb',
    yaw: 0.75,
    pitch: 0.12,
    fit: 0.86,
    image: eagleImg,
    // Eye and gilded beak.
    lens: lensPosition(0.7, 0.12, 5.2, 883 / 560),
  },
  {
    url: '/thuyen-buom.glb',
    yaw: Math.PI - 0.5,
    pitch: 0.12,
    image: boatImg,
    // Mid-mast sails and rigging.
    lens: lensPosition(0.47, 0.36, 5.2, 688 / 760),
  },
];

const DEFAULT_INDEX = 1;
const SWAP_OUT_MS = 200;
const CLOSE_UP_ZOOM = 2.6;

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * "Filigree Atlas": the two silver-filigree artifacts from the heritage digitization project,
 * shown as a full-height field-guide spread. One canvas covers the whole section so a model is
 * never clipped by a panel; three.js and the models load only once the section is near.
 */
export function ArtifactAtlas() {
  const { t } = useLang();
  const a = t.artifacts;
  const caseStudyUrl = t.projects.items.find((p) => p.images?.some((img) => img.src.includes('vr360')))?.caseStudyUrl;

  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const engineRef = useRef<ArtifactStage | null>(null);
  const activeRef = useRef(DEFAULT_INDEX);
  const lightRef = useRef<LightMode>('night');
  const swapTimer = useRef(0);
  const onScreenRef = useRef(false);
  const lastSwitch = useRef(0);
  const lastTurn = useRef(0);

  const [active, setActive] = useState(DEFAULT_INDEX);
  const [shown, setShown] = useState(DEFAULT_INDEX);
  const [phase, setPhase] = useState<'rest' | 'out' | 'in'>('rest');
  const [loadStates, setLoadStates] = useState<LoadState[]>(() => MODELS.map(() => 'idle'));
  const [webglFailed, setWebglFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [focus, setFocus] = useState(false);
  const [light, setLight] = useState<LightMode>('night');
  const [hintGone, setHintGone] = useState(false);

  // Boot the engine when the section comes near, run it only while it is on screen.
  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!hero || !stage || !canvas) return;

    let cancelled = false;
    let booting = false;
    const sync = () => engineRef.current?.setRunning(onScreenRef.current && !document.hidden);

    function boot() {
      if (booting) return;
      booting = true;
      import('./stage')
        .then(({ ArtifactStage }) => {
          if (cancelled) return;
          engineRef.current = new ArtifactStage({
            hero: hero!,
            stage: stage!,
            canvas: canvas!,
            models: MODELS,
            initial: activeRef.current,
            reducedMotion: prefersReducedMotion(),
            light: lightRef.current,
            onLoadState: (index, state) => {
              setLoadStates((prev) => prev.map((s, i) => (i === index ? state : s)));
              // The artifact on view finished loading; background loads and errors stay silent.
              if (state === 'ready' && index === activeRef.current && onScreenRef.current) {
                sfx.play('chime', { rate: 0.84, intensity: 0.6, source: 'auto' });
              }
            },
            onZoom: setZoom,
            onInteract: () => setHintGone(true),
          });
          sync();
        })
        .catch(() => {
          if (!cancelled) setWebglFailed(true);
        });
    }

    const near = new IntersectionObserver(([entry]) => entry.isIntersecting && boot(), { rootMargin: '120% 0px' });
    const visible = new IntersectionObserver(([entry]) => {
      onScreenRef.current = entry.isIntersecting;
      sync();
    });
    near.observe(hero);
    visible.observe(hero);
    document.addEventListener('visibilitychange', sync);

    return () => {
      cancelled = true;
      near.disconnect();
      visible.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.clearTimeout(swapTimer.current);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    lightRef.current = light;
    engineRef.current?.setLight(light);
  }, [light]);

  useEffect(() => {
    engineRef.current?.setFocus(focus);
    if (!focus) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setFocus(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [focus]);

  // Sounds for focus mode (button or Escape) and the light switch; the first render is silent.
  const prevFocus = useRef(focus);
  useEffect(() => {
    if (prevFocus.current === focus) return;
    prevFocus.current = focus;
    sfx.play('whoosh', focus ? { intensity: 0.7, rate: 0.85 } : { intensity: 0.35, rate: 1.15 });
  }, [focus]);

  const prevLight = useRef(light);
  useEffect(() => {
    if (prevLight.current === light) return;
    prevLight.current = light;
    if (light === 'day') sfx.play('toggleOn', { rate: 1.12 });
    else sfx.play('toggleOff', { rate: 0.84 });
  }, [light]);

  const select = useCallback((index: number) => {
    if (index === activeRef.current || index < 0 || index >= MODELS.length) return;
    const now = performance.now();
    if (now - lastSwitch.current > 250) {
      lastSwitch.current = now;
      const dir = Math.sign(index - activeRef.current);
      sfx.play('slide', { intensity: 0.8, pan: dir * 0.35, rate: dir > 0 ? 1.05 : 0.95 });
      sfx.play('chime', { step: index + 3, intensity: 0.4, delay: 480 });
    }
    activeRef.current = index;
    setActive(index);
    setZoom(1);
    engineRef.current?.select(index);
    window.clearTimeout(swapTimer.current);
    if (prefersReducedMotion()) {
      setShown(index);
      return;
    }
    setPhase('out');
    swapTimer.current = window.setTimeout(() => {
      setShown(index);
      setPhase('in');
    }, SWAP_OUT_MS);
  }, []);

  const step = (delta: number) => select((activeRef.current + delta + MODELS.length) % MODELS.length);

  function zoomStep(zoomIn: boolean) {
    const engine = engineRef.current;
    if (!engine) return;
    const before = engine.getZoomTarget();
    engine.zoomBy(zoomIn ? 1.35 : 1 / 1.35, { silent: true });
    if (engine.getZoomTarget() !== before) sfx.play('slide', { intensity: 0.35, rate: zoomIn ? 1.2 : 0.8 });
    else sfx.play('bump', { intensity: 0.6 });
  }

  function turn(radians: number) {
    const now = performance.now();
    if (now - lastTurn.current > 150) {
      lastTurn.current = now;
      if (Math.abs(radians) >= Math.PI * 2) {
        sfx.play('whoosh', { intensity: 0.6 });
        sfx.play('chime', { intensity: 0.35, delay: 1100 });
      } else {
        sfx.play('slide', { intensity: 0.5, pan: Math.sign(radians) * 0.35 });
      }
    }
    engineRef.current?.turn(radians);
  }

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = (active + (e.key === 'ArrowRight' ? 1 : -1) + MODELS.length) % MODELS.length;
    select(next);
    tabRefs.current[next]?.focus();
  }

  const item = a.items[shown];
  const model = MODELS[shown];
  const state = loadStates[active];
  const loading = !webglFailed && (state === 'idle' || state === 'loading');
  const failed = webglFailed || state === 'error';
  const closeUp = zoom > 2.2;

  // Children of the detail article animate in one after another after each swap.
  let order = 0;
  const rise = (): CSSProperties => ({ '--i': order++ }) as CSSProperties;

  return (
    <section
      ref={heroRef}
      id="artifacts"
      className={`atlas${focus ? ' focus' : ''}`}
      data-light={light}
      aria-labelledby="atlas-title"
    >
      <IconSprite />
      <canvas ref={canvasRef} className="atlas-gl" aria-hidden="true" />

      {/* Left: brand, sections, featured card */}
      <aside className="atlas-side" inert={focus}>
        <h2 id="atlas-title" className="atlas-brand">
          {a.brand}
        </h2>
        <ul className="atlas-nav">
          <li>
            <a href="#projects" className="atlas-nav-item">
              <Icon name="home" />
              <span>
                {a.nav.project}
                <small>{a.nav.projectSub}</small>
              </span>
            </a>
          </li>
          {(['eagle', 'boat'] as const).map((key, i) => (
            <li key={key}>
              <button
                type="button"
                className="atlas-nav-item"
                aria-current={active === i ? 'true' : undefined}
                data-sfx="off"
                onClick={() => select(i)}
              >
                <Icon name={key} />
                <span>
                  {a.nav[key]}
                  <small>{a.nav.oneItem}</small>
                </span>
              </button>
            </li>
          ))}
          {caseStudyUrl && (
            <li>
              <a href={caseStudyUrl} className="atlas-nav-item" target="_blank" rel="noopener noreferrer">
                <Icon name="vr" />
                <span>
                  {a.nav.tour}
                  <small>{a.nav.tourSub}</small>
                </span>
              </a>
            </li>
          )}
        </ul>

        <div className="atlas-featured">
          <p className="atlas-eyebrow">{a.featuredEyebrow}</p>
          <img src={model.image} alt="" className="atlas-featured-img" decoding="async" />
          <p className="atlas-featured-title">{item.featuredTitle}</p>
          <p className="atlas-featured-text">{item.featuredText}</p>
          {caseStudyUrl && (
            <a href={caseStudyUrl} className="atlas-featured-link" target="_blank" rel="noopener noreferrer">
              {a.featuredLink}
              <Icon name="arrowRight" size={14} />
            </a>
          )}
        </div>
      </aside>

      {/* Centre: tabs and the stage */}
      <div className="atlas-main">
        <div className="atlas-tabs" inert={focus} role="tablist" aria-label={a.tabsLabel} onKeyDown={onTabKey}>
          {a.items.map((it, i) => (
            <button
              key={it.short}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`atlas-tab-${i}`}
              aria-selected={active === i}
              aria-controls="atlas-panel"
              tabIndex={active === i ? 0 : -1}
              className="atlas-tab"
              data-sfx="off"
              onClick={() => select(i)}
            >
              <img src={MODELS[i].image} alt="" decoding="async" />
              <span className="atlas-tab-text">
                <span className="atlas-tab-name">{it.short}</span>
                <span className="atlas-tab-sub">{it.material}</span>
              </span>
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          id="atlas-stage"
          className="atlas-stage"
          tabIndex={0}
          role="application"
          aria-roledescription="3D"
          aria-label={`${a.items[active].name}. ${a.stageLabel}`}
        >
          <div className="atlas-ground" aria-hidden="true" />

          <div className={`atlas-loader${loading ? ' is-on' : ''}`} aria-hidden={!loading}>
            <span className="atlas-ring" />
            <span>{a.loading}</span>
          </div>

          {failed && <img className="atlas-fallback" src={MODELS[active].image} alt={a.items[active].name} />}

          <p className={`atlas-hint${hintGone ? ' is-gone' : ''}`} aria-hidden="true">
            <Icon name="hand" size={15} />
            {a.hint}
          </p>

          <div className="atlas-rail">
            <button
              type="button"
              className={`atlas-round${zoom >= 1 ? ' on' : ''}`}
              aria-label={a.zoomIn}
              aria-pressed={zoom >= 1}
              data-sfx="off"
              onClick={() => zoomStep(true)}
            >
              <Icon name="zoomIn" />
            </button>
            <button
              type="button"
              className={`atlas-round${zoom < 1 ? ' on' : ''}`}
              aria-label={a.zoomOut}
              aria-pressed={zoom < 1}
              data-sfx="off"
              onClick={() => zoomStep(false)}
            >
              <Icon name="zoomOut" />
            </button>
            <button
              type="button"
              className={`atlas-round${focus ? ' on' : ''}`}
              aria-label={a.expand}
              aria-pressed={focus}
              data-sfx="off"
              onClick={() => setFocus((f) => !f)}
            >
              <Icon name="expand" />
            </button>
            <button
              type="button"
              className={`atlas-round${light === 'day' ? ' on' : ''}`}
              aria-label={a.light}
              aria-pressed={light === 'day'}
              data-sfx="off"
              onClick={() => setLight((l) => (l === 'day' ? 'night' : 'day'))}
            >
              <Icon name="sun" />
            </button>
          </div>

          <div className="atlas-turn">
            <button type="button" aria-label={a.turnLeft} data-sfx="off" onClick={() => turn(-Math.PI / 2)}>
              <Icon name="rotateLeft" size={16} />
            </button>
            <button
              type="button"
              className="atlas-turn-full"
              aria-label={a.turnFull}
              data-sfx="off"
              onClick={() => turn(Math.PI * 2)}
            >
              360°
            </button>
            <button type="button" aria-label={a.turnRight} data-sfx="off" onClick={() => turn(Math.PI / 2)}>
              <Icon name="rotateRight" size={16} />
            </button>
          </div>

          <p key={shown} className="atlas-caption">
            {item.caption}
          </p>
        </div>
      </div>

      {/* Right: counter and the detail card */}
      <div className="atlas-info" inert={focus}>
        <div className="atlas-top">
          <span className="atlas-top-brand">{a.brand}</span>
          <span className="atlas-eyebrow atlas-top-source">{a.source}</span>
          <span className="atlas-counter" aria-label={`${a.counterLabel} ${active + 1} / ${MODELS.length}`}>
            {pad2(active + 1)}
            <span aria-hidden="true"> / {pad2(MODELS.length)}</span>
          </span>
          <button type="button" className="atlas-icon-btn" aria-label={a.prev} data-sfx="off" onClick={() => step(-1)}>
            <Icon name="chevronLeft" size={17} />
          </button>
          <button type="button" className="atlas-icon-btn" aria-label={a.next} data-sfx="off" onClick={() => step(1)}>
            <Icon name="chevronRight" size={17} />
          </button>
        </div>

        <div className="atlas-card" id="atlas-panel" role="tabpanel" aria-labelledby={`atlas-tab-${shown}`}>
          <article key={shown} className={`atlas-detail is-${phase}`} aria-live="polite">
            <p className="atlas-eyebrow" style={rise()}>
              {item.material}
            </p>
            <h3 className="atlas-name" style={rise()}>
              {item.short}
            </h3>
            <p className="atlas-fullname" style={rise()}>
              {item.name}
            </p>
            <ul className="atlas-tags" style={rise()}>
              {item.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <p className="atlas-desc" style={rise()}>
              {item.description}
            </p>
            <h4 className="atlas-h" style={rise()}>
              {a.traitsHeading}
            </h4>
            {item.traits.map((trait) => (
              <div key={trait.label} className="atlas-trait" style={rise()}>
                <Icon name={trait.icon} />
                <span className="atlas-trait-label">{trait.label}</span>
                <span>{trait.value}</span>
              </div>
            ))}
            <h4 className="atlas-h" style={rise()}>
              {a.highlightHeading}
            </h4>
            <div className="atlas-highlight" style={rise()}>
              <Icon name={item.highlight.icon} />
              <span>{item.highlight.text}</span>
            </div>
            <button
              type="button"
              className="atlas-closeup"
              style={rise()}
              aria-pressed={closeUp}
              data-sfx="off"
              onClick={() => {
                const engine = engineRef.current;
                if (!engine) return;
                if (closeUp) sfx.play('slide', { rate: 0.85, intensity: 0.4 });
                else sfx.play('reveal', { intensity: 0.6 });
                engine.setZoom(closeUp ? 1 : CLOSE_UP_ZOOM, { silent: true });
              }}
            >
              <span
                className="atlas-lens"
                aria-hidden="true"
                style={{ backgroundImage: `url(${model.image})`, backgroundPosition: model.lens }}
              />
              <span className="atlas-closeup-text">
                <span className="atlas-closeup-title">{a.closeUpTitle}</span>
                <span className="atlas-closeup-desc">{item.closeUp}</span>
              </span>
              <Icon name="chevronRight" size={18} className="atlas-closeup-chev" />
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
