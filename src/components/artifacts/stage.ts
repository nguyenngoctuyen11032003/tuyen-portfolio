import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  Euler,
  Group,
  MathUtils,
  Mesh,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, damp, easeInCubic, easeOutCubic, outBack, radiusPx } from './math';
import { sfx } from '../../sound';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';
export type LightMode = 'night' | 'day';

export interface StageModel {
  url: string;
  /** Home orientation: yaw then pitch (Euler order YXZ). */
  yaw: number;
  pitch: number;
  /** Scale on top of the unit bounding sphere, for shapes that fill their sphere unevenly. */
  fit?: number;
}

export interface StageOptions {
  hero: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  models: StageModel[];
  initial: number;
  reducedMotion: boolean;
  light: LightMode;
  onLoadState: (index: number, state: LoadState) => void;
  /** Fires when the zoom target crosses a threshold the UI cares about. */
  onZoom: (zoom: number) => void;
  /** First pointer, wheel or key interaction on the stage. */
  onInteract: () => void;
}

const FOV = 26;
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 3.4;
const SWITCH_MS = 780;
const FOCUS_SCALE = 0.95;
const IDLE_AFTER = 1.8;
const IDLE_RAMP = 1.5;
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);
/** Scratch rotation reused by every drag step, so dragging allocates nothing per pointer move. */
const STEP = new Quaternion();
/** Frame interval (s) that counts as struggling (~45 fps), and how long it must last. */
const SLOW_FRAME = 1 / 45;
const SLOW_FOR = 1.5;

/** Light rig per gallery mode; eased toward each frame. */
const LIGHTS: Record<LightMode, { env: number; key: number; keyColor: Color; rim: number; exposure: number }> = {
  night: { env: 0.72, key: 2.3, keyColor: new Color('#ffe2bd'), rim: 1.5, exposure: 1.0 },
  day: { env: 0.95, key: 1.6, keyColor: new Color('#fff4e2'), rim: 0.5, exposure: 1.05 },
};

interface Rig {
  pivot: Group;
  spin: Group;
  holder: Group;
  home: Quaternion;
  state: LoadState;
  promise?: Promise<void>;
}

/**
 * The 3D side of the artifact atlas: one full-section canvas, a rig per artifact
 * (pivot › spin › holder › glTF scene) and all pointer, wheel and keyboard handling on the stage.
 * The DOM (tabs, panels, buttons) lives in React and drives this through the public methods.
 */
export class ArtifactStage {
  private o: StageOptions;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 0.05, 100);
  private key = new DirectionalLight('#fff4e2', 1.6);
  private rim = new DirectionalLight('#bfd8ff', 0.5);
  private loader = new GLTFLoader();
  private rigs: Rig[];
  private active: number;
  private light: LightMode;

  // Framing (hero pixels), eased toward targets.
  private heroW = 1;
  private heroH = 1;
  private target = { cx: 0, cy: 0, px: 1, stageW: 1 };
  private cx = 0;
  private cy = 0;
  private px = 1;
  private framed = false;
  private focus = false;

  // View state.
  private zoom = 1;
  private zoomTarget = 1;
  private lastZoomSent = 1;
  private turnQueue = 0;
  private homing = false;
  private velX = 0;
  private velY = 0;

  // Sound: zoom detents (one notch per ~12.7% of zoom), edge bump, held-arrow throttle.
  private lastNotch = 0;
  private lastDetentAt = 0;
  private wasAtEdge = false;
  private lastNudge = 0;

  // Pointers.
  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private lastMove = 0;
  private engaged = false;
  private interacted = false;
  private lastInteraction = 0;
  private idle = 0;

  // Tab switch.
  private switching: { from: number; to: number; dir: number; start: number; inStart: number | null } | null = null;

  // Adaptive resolution: the canvas covers the whole section, so on a GPU that cannot keep up
  // at full pixel ratio it steps down (never below 1) instead of dropping frames.
  private pixelRatio = 1;
  private frameAvg = 1 / 60;
  private slowFor = 0;

  private clock = 0;
  private lastFrame = 0;
  private raf = 0;
  private running = false;
  private disposed = false;
  private cleanups: (() => void)[] = [];
  private resizeObserver: ResizeObserver;

  constructor(options: StageOptions) {
    this.o = options;
    this.active = options.initial;
    this.light = options.light;

    const renderer = new WebGLRenderer({ canvas: options.canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(this.pixelRatio);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = typeof NeutralToneMapping === 'number' ? NeutralToneMapping : ACESFilmicToneMapping;
    renderer.toneMappingExposure = LIGHTS[this.light].exposure;
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;

    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environmentIntensity = LIGHTS[this.light].env;

    this.key.position.set(2.5, 4, 5);
    this.rim.position.set(-4, 2, -3);
    this.key.intensity = LIGHTS[this.light].key;
    this.key.color.copy(LIGHTS[this.light].keyColor);
    this.rim.intensity = LIGHTS[this.light].rim;
    this.scene.add(this.key, this.rim);
    this.camera.position.set(0, 0, 6);

    this.loader.setMeshoptDecoder(MeshoptDecoder);

    this.rigs = options.models.map((m) => {
      const pivot = new Group();
      const spin = new Group();
      const holder = new Group();
      const home = new Quaternion().setFromEuler(new Euler(m.pitch, m.yaw, 0, 'YXZ'));
      spin.quaternion.copy(home);
      spin.add(holder);
      pivot.add(spin);
      pivot.visible = false;
      this.scene.add(pivot);
      return { pivot, spin, holder, home, state: 'idle' as LoadState };
    });
    this.rigs[this.active].pivot.visible = true;

    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(options.hero);
    this.resizeObserver.observe(options.stage);
    this.measure();
    this.bindInput();

    // Active artifact first, then the rest in the background.
    void this.load(this.active).then(() => {
      this.rigs.forEach((_, i) => {
        if (i !== this.active) void this.load(i);
      });
    });
  }

  // ---------------------------------------------------------------- public API

  /** Runs the render loop only while the section is on screen. */
  setRunning(on: boolean) {
    if (this.disposed || on === this.running) return;
    this.running = on;
    if (on) {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  select(index: number) {
    if (index === this.active || !this.rigs[index]) return;
    const from = this.active;
    this.active = index;
    this.touch();
    this.velX = this.velY = 0;
    this.turnQueue = 0;
    this.homing = false;
    this.zoomTarget = 1;
    this.lastNotch = 0;
    this.wasAtEdge = false;
    this.emitZoom();

    const incoming = this.rigs[index];
    incoming.spin.quaternion.copy(incoming.home);

    if (this.o.reducedMotion) {
      this.rigs.forEach((r, i) => this.resetPivot(r, i === index));
      this.switching = null;
      void this.load(index);
      return;
    }

    // A switch mid-switch: the bird that was arriving leaves from where it is.
    if (this.switching) this.rigs.forEach((r, i) => i !== from && i !== index && this.resetPivot(r, false));
    const now = performance.now();
    this.switching = {
      from,
      to: index,
      dir: Math.sign(index - from) || 1,
      start: now,
      inStart: incoming.state === 'ready' ? now : null,
    };
    this.o.stage.classList.add('is-switching');
    void this.load(index);
  }

  zoomBy(factor: number, opts?: { silent?: boolean }) {
    this.setZoom(this.zoomTarget * factor, opts);
  }

  /** `silent`: the caller plays its own sound, so skip the detent tick and the edge bump. */
  setZoom(zoom: number, opts?: { silent?: boolean }) {
    this.zoomTarget = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    const notch = Math.floor(Math.log(this.zoomTarget) / 0.12);
    const atEdge = this.zoomTarget === ZOOM_MIN || this.zoomTarget === ZOOM_MAX;
    if (!opts?.silent && sfx.ready()) {
      const now = performance.now();
      if (atEdge && !this.wasAtEdge) {
        sfx.play('bump', { intensity: 0.5 });
      } else if (notch !== this.lastNotch && now - this.lastDetentAt > 83) {
        sfx.play('tick', { step: notch + 5, intensity: 0.4 });
        this.lastDetentAt = now;
      }
    }
    this.lastNotch = notch;
    this.wasAtEdge = atEdge;
    this.touch();
    this.emitZoom();
  }

  getZoomTarget() {
    return this.zoomTarget;
  }

  /** Queue a yaw turn in radians (consumed smoothly each frame). */
  turn(radians: number) {
    this.homing = false;
    this.turnQueue += radians;
    this.touch();
  }

  resetView() {
    if (sfx.ready()) sfx.play('glide', { intensity: 0.3, rate: 1.1 });
    this.homing = true;
    this.velX = this.velY = 0;
    this.turnQueue = 0;
    this.setZoom(1, { silent: true });
  }

  setFocus(on: boolean) {
    this.focus = on;
    this.measure();
    this.touch();
  }

  setLight(mode: LightMode) {
    this.light = mode;
  }

  dispose() {
    this.disposed = true;
    this.setRunning(false);
    this.resizeObserver.disconnect();
    this.cleanups.forEach((fn) => fn());
    this.scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as Material[];
      mats.forEach((mat) => {
        Object.values(mat).forEach((v) => (v as Texture | null)?.isTexture && (v as Texture).dispose());
        mat.dispose();
      });
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- loading

  private load(index: number): Promise<void> {
    const rig = this.rigs[index];
    if (rig.promise) return rig.promise;
    rig.state = 'loading';
    this.o.onLoadState(index, 'loading');
    rig.promise = this.loader
      .loadAsync(this.o.models[index].url)
      .then((gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        const sphere = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
        model.position.sub(sphere.center);
        rig.holder.scale.setScalar((this.o.models[index].fit ?? 1) / (sphere.radius || 1));
        const aniso = this.renderer.capabilities.getMaxAnisotropy();
        model.traverse((obj) => {
          const mesh = obj as Mesh;
          if (!mesh.isMesh) return;
          mesh.frustumCulled = false;
          const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as (Material & { map?: Texture | null })[];
          mats.forEach((mat) => {
            if (mat.map) mat.map.anisotropy = aniso;
          });
        });
        rig.holder.add(model);
        // Upload textures now so the first visible frame does not hitch.
        void this.renderer.compileAsync(model, this.camera, this.scene).catch(() => undefined);
        rig.state = 'ready';
        this.o.onLoadState(index, 'ready');
        if (this.switching && this.switching.to === index && this.switching.inStart === null) {
          this.switching.inStart = performance.now();
        }
      })
      .catch(() => {
        rig.state = 'error';
        this.o.onLoadState(index, 'error');
      });
    return rig.promise;
  }

  // ---------------------------------------------------------------- layout

  private measure() {
    const hero = this.o.hero.getBoundingClientRect();
    const stage = this.o.stage.getBoundingClientRect();
    this.heroW = Math.max(1, hero.width);
    this.heroH = Math.max(1, hero.height);
    this.renderer.setSize(this.heroW, this.heroH, false);

    if (this.focus) {
      // The whole section, below the strip kept clear for the site header.
      const top = parseFloat(getComputedStyle(this.o.hero).paddingTop) || 0;
      const free = this.heroH - top;
      this.target = {
        cx: this.heroW / 2,
        cy: top + free / 2,
        px: radiusPx(this.heroW, free) * FOCUS_SCALE,
        stageW: this.heroW,
      };
    } else {
      this.target = {
        cx: stage.left - hero.left + stage.width / 2,
        cy: stage.top - hero.top + stage.height * 0.44,
        px: radiusPx(stage.width, stage.height),
        stageW: stage.width,
      };
    }
    if (!this.framed) {
      this.cx = this.target.cx;
      this.cy = this.target.cy;
      this.px = this.target.px;
      this.framed = true;
    }
  }

  // ---------------------------------------------------------------- input

  private touch() {
    this.lastInteraction = this.clock;
    if (!this.interacted) {
      this.interacted = true;
      this.o.onInteract();
    }
  }

  private emitZoom() {
    if (this.zoomTarget !== this.lastZoomSent) {
      this.lastZoomSent = this.zoomTarget;
      this.o.onZoom(this.zoomTarget);
    }
  }

  private rotate(dx: number, dy: number) {
    const spin = this.rigs[this.active].spin;
    spin.quaternion.premultiply(STEP.setFromAxisAngle(Y_AXIS, dx));
    spin.quaternion.premultiply(STEP.setFromAxisAngle(X_AXIS, dy));
    spin.quaternion.normalize();
  }

  private bindInput() {
    const stage = this.o.stage;
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions
    ) => {
      stage.addEventListener(type, fn as EventListener, opts);
      this.cleanups.push(() => stage.removeEventListener(type, fn as EventListener, opts));
    };
    const isControl = (e: Event) => (e.target as HTMLElement).closest('button, a') !== null;
    const pinchDistance = () => {
      const [a, b] = [...this.pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    on('pointerdown', (e) => {
      if (isControl(e) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      stage.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.engaged = true;
      if (this.pointers.size === 1 && sfx.ready()) sfx.play('tap', { rate: 1.3, intensity: 0.35 });
      this.homing = false;
      this.velX = this.velY = 0;
      this.lastMove = performance.now();
      if (this.pointers.size === 2) this.pinchDist = pinchDistance();
      stage.classList.add('is-grabbing');
      this.touch();
    });

    on('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      this.touch();
      if (this.pointers.size >= 2) {
        const d = pinchDistance();
        if (this.pinchDist > 0) this.setZoom(this.zoomTarget * (d / this.pinchDist));
        this.pinchDist = d;
        return;
      }
      const k = Math.PI / Math.max(260, this.px * 1.6);
      this.rotate(dx * k, dy * k);
      const now = performance.now();
      const dt = Math.max(1, now - this.lastMove) / 1000;
      this.lastMove = now;
      this.velX = (dx * k) / dt;
      this.velY = (dy * k) / dt;
    });

    const release = (e: PointerEvent) => {
      if (!this.pointers.delete(e.pointerId)) return;
      if (this.pointers.size < 2) this.pinchDist = 0;
      if (this.pointers.size === 0) {
        stage.classList.remove('is-grabbing');
        // A pause before letting go means no fling.
        if (performance.now() - this.lastMove > 80) this.velX = this.velY = 0;
      }
    };
    on('pointerup', release);
    on('pointercancel', release);
    on('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && this.pointers.size === 0) this.engaged = false;
    });

    // Plain wheel scrolls the page unless the visitor is already working with the stage;
    // Ctrl + wheel (and trackpad pinch, which arrives as one) always zooms.
    on(
      'wheel',
      (e) => {
        if (!e.ctrlKey && !this.engaged) return;
        e.preventDefault();
        this.setZoom(this.zoomTarget * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)));
      },
      { passive: false }
    );

    on('dblclick', (e) => {
      if (!isControl(e)) this.resetView();
    });

    on('keydown', (e) => {
      if (e.target !== stage) return;
      const step = 0.18;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft':
          this.rotate(-step, 0);
          break;
        case 'ArrowRight':
          this.rotate(step, 0);
          break;
        case 'ArrowUp':
          this.rotate(0, -step);
          break;
        case 'ArrowDown':
          this.rotate(0, step);
          break;
        case '+':
        case '=':
          this.zoomBy(1.2);
          break;
        case '-':
        case '_':
          this.zoomBy(1 / 1.2);
          break;
        case '0':
          this.resetView();
          break;
        default:
          handled = false;
      }
      if (handled) {
        const arrow = e.key.startsWith('Arrow');
        const now = performance.now();
        if (arrow && sfx.ready() && (!e.repeat || now - this.lastNudge > 90)) {
          this.lastNudge = now;
          const positive = e.key === 'ArrowRight' || e.key === 'ArrowUp';
          const horizontal = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
          sfx.play('tick', { step: positive ? 4 : 2, intensity: 0.4, pan: horizontal * 0.3 });
        }
        e.preventDefault();
        this.homing = e.key === '0';
        this.touch();
      }
    });
  }

  // ---------------------------------------------------------------- frame

  private adaptResolution(interval: number) {
    // A single long gap is a hitch (loading, a resumed tab), not a trend.
    if (this.pixelRatio <= 1 || interval <= 0 || interval > 0.25) return;
    this.frameAvg += (interval - this.frameAvg) * 0.1;
    this.slowFor = this.frameAvg > SLOW_FRAME ? this.slowFor + interval : 0;
    if (this.slowFor < SLOW_FOR) return;
    this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.frameAvg = 1 / 60;
    this.slowFor = 0;
  }

  private resetPivot(rig: Rig, visible: boolean) {
    rig.pivot.visible = visible;
    rig.pivot.position.set(0, 0, 0);
    rig.pivot.rotation.set(0, 0, 0);
    rig.pivot.scale.setScalar(1);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const interval = (now - this.lastFrame) / 1000;
    const dt = Math.min(0.05, interval);
    this.lastFrame = now;
    this.adaptResolution(interval);
    this.clock += dt;
    const reduced = this.o.reducedMotion;

    // Framing.
    const f = 1 - Math.exp(-dt * 7);
    this.cx += (this.target.cx - this.cx) * f;
    this.cy += (this.target.cy - this.cy) * f;
    this.px += (this.target.px - this.px) * f;
    this.zoom = damp(this.zoom, this.zoomTarget, 6, dt);

    // Lights.
    const L = LIGHTS[this.light];
    this.scene.environmentIntensity = damp(this.scene.environmentIntensity, L.env, 4, dt);
    this.key.intensity = damp(this.key.intensity, L.key, 4, dt);
    this.key.color.lerp(L.keyColor, 1 - Math.exp(-dt * 4));
    this.rim.intensity = damp(this.rim.intensity, L.rim, 4, dt);
    this.renderer.toneMappingExposure = damp(this.renderer.toneMappingExposure, L.exposure, 4, dt);

    // Rotation: inertia, queued turns, homing.
    const rig = this.rigs[this.active];
    if (this.pointers.size === 0 && (this.velX || this.velY)) {
      this.rotate(this.velX * dt, this.velY * dt);
      const decay = Math.exp(-dt * 4.5);
      this.velX *= decay;
      this.velY *= decay;
      if (Math.abs(this.velX) + Math.abs(this.velY) < 0.002) this.velX = this.velY = 0;
      // Fling texture (rad/s); the engine throttles by intensity. Idle sway stays silent.
      if (sfx.ready()) {
        const speed = Math.hypot(this.velX, this.velY);
        if (speed > 0.4) {
          sfx.play('grain', {
            intensity: Math.min(1, speed / 8),
            rate: 1.4,
            pan: Math.max(-0.5, Math.min(0.5, this.velX / 8)),
          });
        }
      }
    }
    if (Math.abs(this.turnQueue) > 1e-4) {
      const step = this.turnQueue * (1 - Math.exp(-dt * 4.2));
      this.rotate(step, 0);
      this.turnQueue -= step;
      this.lastInteraction = this.clock;
    } else {
      this.turnQueue = 0;
    }
    if (this.homing) {
      rig.spin.quaternion.slerp(rig.home, 1 - Math.exp(-dt * 6));
      if (rig.spin.quaternion.angleTo(rig.home) < 1e-3) {
        rig.spin.quaternion.copy(rig.home);
        this.homing = false;
        if (sfx.ready()) sfx.play('tick', { step: 5, intensity: 0.5 });
      }
    }

    // Idle life: a slow sway eases in once nobody has touched anything for a while.
    const quiet = this.clock - this.lastInteraction > IDLE_AFTER && this.pointers.size === 0;
    this.idle = quiet ? Math.min(1, this.idle + dt / IDLE_RAMP) : damp(this.idle, 0, 5, dt);
    const sway = reduced ? 0 : MathUtils.smootherstep(this.idle, 0, 1);

    // Tab switch.
    const slide = (this.target.stageW * 0.95) / Math.max(1, this.px);
    const sw = this.switching;
    let switchYaw: number[] = this.rigs.map(() => 0);
    if (sw) {
      const outT = Math.min(1, (now - sw.start) / (SWITCH_MS * 0.6));
      const out = this.rigs[sw.from];
      const e = easeInCubic(outT);
      out.pivot.visible = outT < 1;
      out.pivot.scale.setScalar(Math.max(0.0001, 1 - e));
      out.pivot.position.x = -sw.dir * e * slide;
      switchYaw[sw.from] = -sw.dir * e * 1.4;

      const inc = this.rigs[sw.to];
      if (sw.inStart === null) {
        inc.pivot.visible = false;
      } else {
        const t = Math.min(1, (now - sw.inStart) / SWITCH_MS);
        const ei = easeOutCubic(t);
        inc.pivot.visible = true;
        inc.pivot.scale.setScalar(Math.max(0.0001, outBack(t) * (0.25 + 0.75 * ei)));
        inc.pivot.position.x = sw.dir * (1 - ei) * slide;
        switchYaw[sw.to] = sw.dir * (1 - ei) * 1.6;
        if (t >= 1 && outT >= 1) {
          this.resetPivot(out, false);
          inc.pivot.scale.setScalar(1);
          inc.pivot.position.x = 0;
          switchYaw = this.rigs.map(() => 0);
          this.switching = null;
          this.o.stage.classList.remove('is-switching');
        }
      }
    }

    this.rigs.forEach((r, i) => {
      if (!r.pivot.visible) return;
      r.pivot.rotation.y = Math.sin(this.clock * 0.55) * 0.16 * sway + switchYaw[i];
      r.pivot.rotation.x = Math.sin(this.clock * 0.9) * 0.03 * sway;
      r.pivot.position.y = reduced ? 0 : Math.sin(this.clock * 1.3 + i) * 0.028;
    });

    // Camera: one world unit spans px * zoom pixels at the origin, and the view offset puts the
    // origin on (cx, cy) without skewing the projection.
    const W = this.heroW;
    const H = this.heroH;
    const halfTan = Math.tan(MathUtils.degToRad(FOV / 2));
    this.camera.position.z = Math.max(1.12, H / (2 * halfTan * this.px * this.zoom));
    this.camera.aspect = W / H;
    this.camera.setViewOffset(W, H, W / 2 - this.cx, H / 2 - this.cy, W, H);
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  };
}
