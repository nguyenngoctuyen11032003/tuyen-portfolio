import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { ProjectDetailModal } from '../ProjectDetailModal';
import { sfx } from '../../sound';
import { collectShots, depthDim, fibonacciSphere, rotatePoint, sphereMetrics, titleOverlap } from './sphere';

const DRAG_DEG_PER_PX = 0.13;
const FRICTION = 0.94;
const PITCH_LIMIT = 32;
const REST_TILT = -4;
const IDLE_SPIN = 0.045; // degrees per frame while nobody is dragging
const TOUCH_INTENT_PX = 10;

interface Selection {
  projectIndex: number;
  imageIndex: number;
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * "Project archive": every screenshot laid out on a draggable Fibonacci sphere with the section
 * title on the sphere origin. The section is taller than the viewport; while it is pinned,
 * scrolling dollies the camera toward the sphere. Clicking a card opens that project's details.
 */
export function ArchiveSphere() {
  const { t } = useLang();
  const projects = t.projects.items;
  const shots = useMemo(() => collectShots(projects), [projects]);
  const points = useMemo(() => fibonacciSphere(shots.length), [shots.length]);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const openRef = useRef(false);
  const revealedRef = useRef(false); // the reveal swell plays once per mount

  const [armed, setArmed] = useState(false); // images load once the section is near
  const [revealed, setRevealed] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  // The camera loop reads this to freeze the sphere while a project is open.
  useEffect(() => {
    openRef.current = selection !== null;
  }, [selection]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const world = worldRef.current;
    const headline = headlineRef.current;
    if (!section || !stage || !world || !headline) return;

    const reduced = prefersReducedMotion();
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    let metrics = sphereMetrics(window.innerWidth, window.innerHeight, points.length);
    let lastSize = { w: window.innerWidth, h: window.innerHeight };

    // Camera state.
    let spin = 0;
    let dragX = 0;
    let dragY = 0;
    let velX = 0;
    let velY = 0;
    let camZ = 0;
    let dragging = false;
    const lastDim: number[] = [];
    // Title half-size and each card's height, measured in layout(); used to fade cards off the title.
    let titleHalf = { w: 0, h: 0 };
    const cardH: number[] = [];
    const lastFade: number[] = [];

    function layout() {
      metrics = sphereMetrics(window.innerWidth, window.innerHeight, points.length);
      const { radius: R, cardWidth: cw, perspective } = metrics;
      stage!.style.setProperty('--persp', `${perspective}px`);
      points.forEach((p, i) => {
        const card = cardRefs.current[i];
        if (!card) return;
        const tall = card.dataset.tall === 'true';
        const h = tall ? cw * 1.3 : cw / 1.6;
        cardH[i] = h;
        card.style.width = `${cw}px`;
        card.style.height = `${h}px`;
        card.style.marginLeft = `${-cw / 2}px`;
        card.style.marginTop = `${-h / 2}px`;
        card.style.transform =
          `translate3d(${(p.x * R).toFixed(2)}px, ${(-p.y * R).toFixed(2)}px, ${(p.z * R).toFixed(2)}px) ` +
          `rotateY(${p.lon.toFixed(3)}deg) rotateX(${p.lat.toFixed(3)}deg)`;
      });
      measureTitle();
    }

    function measureTitle() {
      const inner = headline!.querySelector<HTMLElement>('.inner');
      titleHalf = { w: headline!.offsetWidth / 2, h: (inner?.offsetHeight ?? 0) / 2 };
    }

    function scrollProgress() {
      const rect = section!.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return 0;
      return Math.min(1, Math.max(0, -rect.top / travel));
    }

    function frame() {
      const { radius: R, perspective } = metrics;
      if (!dragging && !openRef.current) {
        if (!reduced) spin += IDLE_SPIN;
        dragX += velX;
        dragY += velY;
        velX *= FRICTION;
        velY *= FRICTION;
        if (Math.abs(velX) < 0.002) velX = 0;
        if (Math.abs(velY) < 0.002) velY = 0;
      }
      dragY = Math.max(-PITCH_LIMIT - REST_TILT, Math.min(PITCH_LIMIT - REST_TILT, dragY));

      // Texture of the turn: drag/inertia speed only (idle spin stays silent). The engine
      // throttles by intensity, so calling this every frame is fine.
      if (visible && !openRef.current && sfx.ready()) {
        const speed = Math.hypot(velX, velY);
        if (speed > 0.25) {
          sfx.play('grain', { intensity: Math.min(1, speed / 6), pan: Math.max(-0.5, Math.min(0.5, velX / 6)) });
        }
      }

      const p = reduced ? 0 : scrollProgress();
      const camTarget = p * Math.min(90, R * 0.18);
      camZ += (camTarget - camZ) * 0.075;

      const sx = REST_TILT + dragY;
      const sy = spin + dragX;
      world!.style.transform = `translateZ(${camZ.toFixed(2)}px) rotateY(${sy.toFixed(3)}deg) rotateX(${sx.toFixed(3)}deg)`;
      // Undo the world rotation (rightmost function applies first): the title faces the camera
      // and sits on the sphere origin, pushed forward so only the nearest cards pass in front.
      headline!.style.transform = `rotateX(${(-sx).toFixed(3)}deg) rotateY(${(-sy).toFixed(3)}deg) translateZ(${(R * 0.88).toFixed(2)}px)`;
      headline!.style.opacity = String(Math.max(0, 1 - p * 0.55));

      const shade = 1 - Math.min(1, p * 1.6);
      const near = perspective * 0.66;
      points.forEach((pt, i) => {
        const card = cardRefs.current[i];
        if (!card) return;
        const pos = rotatePoint(pt, sy, sx);
        const depth = pos.z;
        const dim = Math.round(Math.min(1, depthDim(depth, shade) + (openRef.current ? 0.6 : 0)) * 100) / 100;
        const z = depth * R + camZ;
        const nearFade = z > near ? Math.max(0, 1 - (z - near) / 190) : 1;
        // Cards passing in front of the title turn into ghosts so the words stay readable.
        const ghost = titleOverlap(pos, R, titleHalf.w, titleHalf.h, metrics.cardWidth, cardH[i] ?? metrics.cardWidth);
        const fade = nearFade * (1 - ghost * 0.85);
        const fadeR = Math.round(fade * 100) / 100;
        if (lastDim[i] !== dim) {
          card.style.setProperty('--d', String(dim));
          lastDim[i] = dim;
        }
        if (lastFade[i] !== fadeR) {
          card.style.opacity = String(fadeR);
          lastFade[i] = fadeR;
        }
      });
    }

    // Run the loop only while the section is on screen.
    let raf = 0;
    let visible = false;
    const loop = () => {
      frame();
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    // Arms image loading 600px early; the camera loop only runs while the section is on screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          if (entry.intersectionRatio > 0.25) {
            setRevealed(true);
            if (!revealedRef.current) {
              revealedRef.current = true;
              sfx.play('swell', { intensity: 0.45, delay: 700, source: 'auto' });
            }
          }
        }
      },
      { rootMargin: '600px 0px', threshold: [0, 0.25] }
    );
    observer.observe(section);
    const loopObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    loopObserver.observe(section);
    layout();
    frame();
    // The title's size changes with the language and its reveal; keep the fade zone in step.
    const titleObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureTitle) : null;
    const titleInner = headline.querySelector('.inner');
    if (titleInner) titleObserver?.observe(titleInner);

    // Drag: mouse/pen rotate at once; touch waits until the gesture is clearly horizontal so a
    // vertical swipe still scrolls the page.
    const clickSlop = coarse ? 14 : 6;
    let pointerId = -1;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;
    let pending = false;
    let dragAnnounced = false; // the first real drag move sounds once per gesture
    let downCard: HTMLElement | null = null;

    function onPointerDown(e: PointerEvent) {
      if (openRef.current || pointerId !== -1 || (e.pointerType === 'mouse' && e.button !== 0)) return;
      downCard = (e.target as HTMLElement).closest<HTMLElement>('[data-shot]');
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      moved = 0;
      velX = velY = 0;
      if (e.pointerType === 'touch') {
        pending = true;
      } else {
        pending = false;
        dragging = true;
        stage!.setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY));
      if (pending) {
        if (moved < TOUCH_INTENT_PX) return;
        const ax = Math.abs(e.clientX - startX);
        const ay = Math.abs(e.clientY - startY);
        if (ay > ax * 1.15) {
          pointerId = -1; // vertical: leave it to the page scroll
          pending = false;
          return;
        }
        pending = false;
        dragging = true;
        stage!.setPointerCapture(e.pointerId);
      }
      if (!dragging) return;
      if (!dragAnnounced && moved >= clickSlop) {
        dragAnnounced = true;
        sfx.play('tap', { rate: 0.7, intensity: 0.4 });
      }
      lastX = e.clientX;
      lastY = e.clientY;
      velX = dx * DRAG_DEG_PER_PX;
      velY = -dy * DRAG_DEG_PER_PX;
      dragX += velX;
      dragY += velY;
    }

    function onPointerUp(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      const wasClick = moved < clickSlop;
      dragging = false;
      pending = false;
      dragAnnounced = false;
      pointerId = -1;
      if (wasClick) {
        velX = velY = 0;
        if (downCard) {
          const projectIndex = Number(downCard.dataset.project);
          sfx.play('chime', { step: projectIndex, intensity: 0.4, pan: sfx.panAt(e.clientX) });
          setSelection({
            projectIndex,
            imageIndex: Number(downCard.dataset.image),
          });
        }
      } else {
        const sp = Math.hypot(velX, velY);
        if (sp > 0.3) {
          sfx.play('whoosh', {
            intensity: Math.min(0.6, Math.max(0.2, sp / 8)),
            pan: Math.max(-0.5, Math.min(0.5, velX / 6)),
          });
        }
      }
      downCard = null;
    }

    function onPointerCancel(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      dragging = false;
      pending = false;
      dragAnnounced = false;
      pointerId = -1;
      downCard = null;
    }

    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Ignore scrollbar and mobile URL-bar jitter.
      if (Math.abs(w - lastSize.w) < 20 && Math.abs(h - lastSize.h) < 20) return;
      lastSize = { w, h };
      layout();
    }

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      loopObserver.disconnect();
      titleObserver?.disconnect();
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('resize', onResize);
    };
  }, [points]);

  const words = t.archive.heading.split(' ');
  const selectedProject = selection ? projects[selection.projectIndex] : null;

  return (
    <section
      id="archive"
      ref={sectionRef}
      aria-labelledby="archive-heading"
      className={`archive relative bg-black ${revealed ? 'is-revealed' : ''}`}
    >
      <div className="archive-pin">
        <div ref={stageRef} className="archive-stage" data-sfx-hover="off">
          <div ref={worldRef} className="archive-world">
            <div className="archive-orb" aria-hidden="true">
              {shots.map((shot, i) => (
                <div
                  key={shot.key}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="archive-card"
                  data-shot
                  data-tall={shot.tall}
                  data-project={shot.projectIndex}
                  data-image={shot.imageIndex}
                  title={projects[shot.projectIndex]?.title}
                >
                  <figure>
                    {armed && (
                      <img
                        src={shot.thumb}
                        alt=""
                        decoding="async"
                        draggable={false}
                        onLoad={(e) => e.currentTarget.classList.add('in')}
                      />
                    )}
                  </figure>
                </div>
              ))}
            </div>
            <h2 id="archive-heading" ref={headlineRef} className="archive-headline">
              <span className="inner">
                <span className="archive-eyebrow">{t.archive.eyebrow}</span>
                {words.map((word, i) => (
                  <Fragment key={`${word}-${i}`}>
                    {i > 0 && ' '}
                    <span className="archive-word" style={{ '--i': i } as CSSProperties}>
                      {word}
                    </span>
                  </Fragment>
                ))}
              </span>
            </h2>
          </div>
        </div>

        <div className="archive-vignette" aria-hidden="true" />

        <p className="archive-count">
          {shots.length} {t.archive.shots} · {projects.length} {t.archive.projects}
        </p>
        <p className="archive-cue" aria-hidden="true">
          <s />
          {t.archive.hint}
        </p>
        <a href="#projects" className="archive-list-link">
          {t.archive.listLink}
          <ArrowDown size={14} aria-hidden="true" />
        </a>
      </div>

      <ProjectDetailModal
        project={selectedProject}
        initialImage={selection?.imageIndex ?? 0}
        onClose={() => setSelection(null)}
      />
    </section>
  );
}
