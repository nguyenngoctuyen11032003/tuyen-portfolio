/**
 * The hero's 3D portrait (lazy-loaded; never imported eagerly). A full-body scan of Tuyền is lit
 * in the site's palette and framed head-to-thigh so it bleeds off the bottom of the hero.
 *
 * The turn is a dial the pointer holds (not playback): horizontal mouse travel anywhere on the page
 * turns the figure — left turns it to its left, right turns it back — with hard stops, and it stays
 * where it was left. Touch devices get a slow automatic sway; reduced motion holds the front pose.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sfx } from '../../sound';

export type AvatarMode = 'scrub' | 'sway' | 'still';

export interface AvatarOptions {
  canvas: HTMLCanvasElement;
  /** Element whose size the canvas fills; observed for resizes. */
  container: HTMLElement;
  /** Section used to pause rendering while off screen. */
  section: HTMLElement;
  url: string;
  mode: AvatarMode;
  onProgress: (fraction: number) => void;
  /** First frame with the model on screen. */
  onReady: () => void;
  onError: () => void;
}

export interface AvatarStage {
  /** Plays the entrance (fade + settle). Safe to call before the model has loaded. */
  reveal: () => void;
  dispose: () => void;
}

/** Fraction of the turn range covered by one full-width mouse sweep. */
const SENSITIVITY = 0.8;
/** Hard stops of the turn, in radians either side of facing the camera. */
const TURN_LIMIT = THREE.MathUtils.degToRad(70);
/** Angle between the audible detents of the turn. */
const NOTCH_DEG = 12;
/** World-space height of the frame at the model (model is ~1.9 tall, feet at -0.95). */
const VIEW_HEIGHT = 1.38;
/** Top of the frame sits this far above the head. */
const HEADROOM = 0.17;
const FOV = 24;

export function mountAvatar(o: AvatarOptions): AvatarStage {
  const renderer = new THREE.WebGLRenderer({
    canvas: o.canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Slightly under 1 with a lighter fill so the face keeps its shape (cheekbones, nose, eye sockets)
  // instead of washing flat and chalky.
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.42;

  // Portrait lighting: a warm key from the front-right, a soft neutral fill from the left so the
  // shadow side keeps detail, a cool white hair/shoulder light from behind, and only a thin emerald
  // edge for the site's palette. (A strong emerald rim dyed the hair and cheeks green.)
  const key = new THREE.DirectionalLight(0xffe6cf, 2.4);
  key.position.set(1.6, 2.2, 2.4);
  const fillLight = new THREE.DirectionalLight(0xdfe6ff, 0.55);
  fillLight.position.set(-2.4, 0.6, 1.6);
  const hairLight = new THREE.DirectionalLight(0xeef3ff, 1.6);
  hairLight.position.set(0.4, 2.6, -2.2);
  const rim = new THREE.DirectionalLight(0x34d399, 1.1);
  rim.position.set(-2.2, 1.0, -1.8);
  const fill = new THREE.HemisphereLight(0xb8c4e6, 0x0a0d10, 0.35);
  scene.add(key, fillLight, hairLight, rim, fill);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  const pivot = new THREE.Group();
  scene.add(pivot);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let disposed = false;
  let model: THREE.Object3D | null = null;

  // --- Framing ------------------------------------------------------------------------------------
  let top = 0.95;
  const layout = () => {
    const w = Math.max(1, o.container.clientWidth);
    const h = Math.max(1, o.container.clientHeight);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the frame height, but never let the shoulders clip on narrow boxes.
    const viewH = Math.max(VIEW_HEIGHT, 0.95 / camera.aspect);
    const dist = viewH / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const centreY = top + HEADROOM - viewH / 2;
    camera.position.set(0, centreY + 0.04, dist);
    camera.lookAt(0, centreY, 0);
    camera.updateProjectionMatrix();
    requestRender();
  };

  // --- Turn state ---------------------------------------------------------------------------------
  let target = 0;
  let current = 0;
  let prevX: number | null = null;
  const intro = { t: 0, start: 0, playing: false, wanted: false };
  // The dial clicks every NOTCH_DEG and knocks at the hard stops. Seeded from the starting pose so
  // the first mouse move is silent.
  let lastNotch = Math.round(THREE.MathUtils.radToDeg(target) / NOTCH_DEG);
  let wasAtLimit = false;

  const onMouseMove = (e: MouseEvent) => {
    if (prevX === null) {
      prevX = e.clientX;
      return;
    }
    const delta = prevX - e.clientX;
    prevX = e.clientX;
    if (!delta) return;
    const rawTarget = target + (delta / window.innerWidth) * SENSITIVITY * TURN_LIMIT * 2;
    target = Math.max(-TURN_LIMIT, Math.min(TURN_LIMIT, rawTarget));
    requestRender();

    // Only audible while the figure is revealed and on screen; state still tracks otherwise.
    const audible = visible && readyFired;
    const deg = THREE.MathUtils.radToDeg(target);
    const notch = Math.round(deg / NOTCH_DEG);
    if (notch !== lastNotch) {
      lastNotch = notch;
      if (audible) {
        sfx.play('grain', { intensity: 0.25, pan: Math.max(-0.5, Math.min(0.5, deg / 140)), source: 'auto' });
      }
    }
    const atLimit = Math.abs(rawTarget) >= TURN_LIMIT;
    if (atLimit && !wasAtLimit && audible) {
      sfx.play('bump', { intensity: 0.4, pan: Math.sign(rawTarget) * 0.5, source: 'auto' });
    }
    wasAtLimit = atLimit;
  };
  const reanchor = () => {
    prevX = null;
  };
  if (o.mode === 'scrub') {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', reanchor);
    window.addEventListener('blur', reanchor);
  }

  // --- Loop (renders on demand; sway mode renders continuously while visible) -----------------------
  let raf = 0;
  let visible = true;
  let last = 0;
  let readyFired = false;
  let shownOpacity = '';

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = last ? Math.min(64, now - last) : 16.67;
    last = now;

    if (o.mode === 'sway') target = Math.sin(now / 2600) * 0.5;
    const k = 1 - Math.pow(0.86, dt / 16.67);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0004) current = target;

    let settling = false;
    if (intro.playing) {
      intro.t = Math.min(1, (now - intro.start) / 1250);
      settling = intro.t < 1;
    }
    const e = 1 - Math.pow(1 - intro.t, 3);
    pivot.rotation.y = current;
    pivot.scale.setScalar(1.028 - 0.028 * e);
    pivot.position.y = -0.03 * (1 - e);
    const opacity = model ? String(e) : '0';
    if (opacity !== shownOpacity) {
      o.canvas.style.opacity = opacity;
      shownOpacity = opacity;
    }

    renderer.render(scene, camera);
    if (model && intro.playing && !readyFired) {
      readyFired = true;
      o.onReady();
    }

    const moving = current !== target || settling || o.mode === 'sway';
    if (moving && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  function requestRender() {
    if (!raf && !disposed && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const startIntro = () => {
    if (!model || !intro.wanted || intro.playing) return;
    intro.playing = true;
    intro.start = performance.now();
    if (o.mode === 'still') intro.t = 1;
    requestRender();
  };

  // --- Load ---------------------------------------------------------------------------------------
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(
    o.url,
    (gltf) => {
      if (disposed) return;
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const centre = box.getCenter(new THREE.Vector3());
      root.position.x -= centre.x;
      root.position.z -= centre.z;
      top = box.max.y;
      const textures: THREE.Texture[] = [];
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        mat.envMapIntensity = 0.6;
        // The scan's roughness map averages ~0.54, which reads as plastic on skin and cloth.
        // Scaling it (three clamps at 1) gives skin a soft sheen and the jacket a matte fabric look.
        mat.roughness = 1.4;
        mat.metalness = 0;
        // Stronger normals bring out fabric folds, knuckles and hair strands.
        mat.normalScale?.set(1.5, 1.5);
        for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap]) if (tex) textures.push(tex);
      });
      pivot.add(root);
      model = root;
      layout();
      // Compile shaders and upload textures up front so the first revealed frame does not hitch.
      renderer.compile(scene, camera);
      textures.forEach((tex) => renderer.initTexture(tex));
      o.onProgress(1);
      startIntro();
    },
    (event) => {
      if (event.lengthComputable && event.total) o.onProgress(Math.min(0.99, event.loaded / event.total));
    },
    () => {
      if (!disposed) o.onError();
    }
  );

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    requestRender();
  });
  io.observe(o.section);
  const onVisibility = () => {
    reanchor();
    requestRender();
  };
  document.addEventListener('visibilitychange', onVisibility);

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 100);
  });
  ro.observe(o.container);

  const onLost = (e: Event) => {
    e.preventDefault();
    dispose();
    o.onError();
  };
  o.canvas.addEventListener('webglcontextlost', onLost);

  layout();

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(resizeTimer);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', reanchor);
    window.removeEventListener('blur', reanchor);
    document.removeEventListener('visibilitychange', onVisibility);
    o.canvas.removeEventListener('webglcontextlost', onLost);
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.MeshStandardMaterial;
      for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap]) tex?.dispose();
      mat.dispose();
    });
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    reveal: () => {
      intro.wanted = true;
      startIntro();
    },
    dispose,
  };
}

/** Reads the visitor's input and motion settings into a turn mode. */
export function avatarMode(): AvatarMode {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'still';
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return 'scrub';
  } catch {
    // Old browsers: fall through to the gentle automatic sway.
  }
  return 'sway';
}
