import { OrbitControls } from './vendor/three/OrbitControls.js?v=2';
import { Three, createStage, createOverlay, flyCamera, materials, pickQuality } from './scene-kit.mjs?v=3';

const defaultAzimuth = Math.PI * .16;
const defaultElevation = Math.PI * .085;
const fov = 40;

// Options added in the second pass (all optional, older callers keep working):
//   purpose, tips, storageKey, schematic  -> first-run hint and one-line purpose in the view
//   time                                  -> starting time of day ('morning' | 'noon' | 'afternoon' | 'dusk')
//   grid                                  -> faint measuring grid on the ground
export function createModelViewer(frame, { onError, enablePan = false, purpose, tips, storageKey, schematic, time = 'afternoon', grid = false, groundColor, onTimeChange, home = {}, timeStates, shift = .17, onHotspot, minDistance, tour = true } = {}) {
  const canvas = frame.querySelector('canvas');
  let renderer;
  try {
    renderer = new Three.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    canvas.hidden = true;
    onError?.();
    return null;
  }
  const scene = new Three.Scene();
  const stage = createStage(renderer, scene, { quality: pickQuality(), time, grid, groundColor });
  const camera = new Three.PerspectiveCamera(fov, 1, .05, 4000);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = enablePan;
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI / 2 - .035;
  const model = new Three.Group();
  scene.add(model);
  let radius = 5, modelCenter = 0, height = 0, width = 0, slow = 0, degraded = stage.quality === 'low';
  const minZoom = .6, maxZoom = 3.4;

  const overlay = createOverlay(frame, {
    purpose, tips, storageKey, schematic, time, states: timeStates, tour,
    // With custom states (a baked model) the page decides what a state means; the sky and sun stay as they are.
    onTime: key => { if (timeStates) { onTimeChange?.(key); return timeStates.find(s => s.key === key); } const state = stage.setTime(key); draw(); onTimeChange?.(key, state); return state; },
    onHotspot: (spot, index) => { if (spot.view) flyTo(spot.view); onHotspot?.(spot, index); },
  });

  function draw() {
    if (!width || !height) return;
    const started = performance.now();
    renderer.render(scene, camera);
    overlay.project(camera);
    // Three slow frames in a row on the high path: drop to the light path for the rest of the visit.
    if (!degraded) { slow = performance.now() - started > 45 ? slow + 1 : 0; if (slow >= 3) { degraded = true; stage.degrade(); renderer.setSize(width, height, false); requestAnimationFrame(draw); } }
  }

  const fitDistance = () => radius / Math.sin(Three.MathUtils.degToRad(fov / 2)) * .8 / Math.min(1, width && height ? width / height : 1);

  function resize() {
    width = frame.clientWidth;
    height = frame.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    // Shift the picture down like an architectural shift lens, so the horizon and sky stay in frame.
    if (shift) camera.setViewOffset(width, height, 0, -height * shift, width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    controls.minDistance = minDistance ?? fitDistance() * .25; controls.maxDistance = fitDistance() * 1.8;
    draw();
  }

  const orbitPosition = (azimuth, elevation, target = controls.target, distance = camera.position.distanceTo(controls.target)) => {
    const horizontal = Math.cos(elevation) * distance;
    return target.clone().add(new Three.Vector3(Math.sin(azimuth) * horizontal, Math.sin(elevation) * distance, Math.cos(azimuth) * horizontal));
  };

  function orbit(azimuth, elevation) {
    camera.position.copy(orbitPosition(azimuth, elevation));
    controls.update();
    draw();
  }

  function zoom(ratio) {
    camera.zoom = Three.MathUtils.clamp(camera.zoom * ratio, minZoom, maxZoom);
    camera.updateProjectionMatrix();
    draw();
  }

  // view: { azimuth, elevation (radians), target: [x, y, z], distance (multiple of the fitted distance), zoom }
  function flyTo(view = {}, duration) {
    if (view.position) { // absolute pose in metres, used for eye-level views inside a model
      flyCamera(camera, controls, { position: new Three.Vector3(...view.position), target: new Three.Vector3(...view.target), zoom: view.zoom ?? 1 }, draw, duration);
      return;
    }
    const target = view.target ? new Three.Vector3(...view.target) : new Three.Vector3(0, modelCenter, 0);
    const position = orbitPosition(view.azimuth ?? home.azimuth ?? defaultAzimuth, view.elevation ?? home.elevation ?? defaultElevation, target, fitDistance() * (view.distance ?? home.distance ?? 1));
    flyCamera(camera, controls, { position, target, zoom: view.zoom ?? 1 }, draw, duration);
  }

  function fitView() { flyTo({}); }

  function refreshLighting() {
    renderer.shadowMap.needsUpdate = true;
    draw();
  }

  function replace(content, { size, center = 0, hotspots, keepPose = false } = {}) {
    const resources = new Set();
    model.traverse(({ geometry, material }) => {
      if (geometry) resources.add(geometry);
      for (const item of [].concat(material || [])) { resources.add(item); for (const slot of ['map', 'emissiveMap', 'alphaMap']) if (item[slot]?.isTexture && !item[slot].isCanvasTexture) resources.add(item[slot]); }
    });
    model.clear();
    for (const resource of resources) resource.dispose();
    model.add(content);
    const first = radius === 5 && !modelCenter;
    radius = Math.max(1, size);
    modelCenter = center;
    stage.setRadius(radius);
    if (hotspots) overlay.setHotspots(hotspots);
    const azimuth = first ? home.azimuth ?? defaultAzimuth : controls.getAzimuthalAngle();
    const elevation = first ? home.elevation ?? defaultElevation : Math.PI / 2 - controls.getPolarAngle();
    const keep = first ? null : camera.position.distanceTo(controls.target), keepTarget = first ? null : controls.target.clone(), keepPosition = first ? null : camera.position.clone();
    controls.target.set(0, center, 0);
    resize();
    camera.position.copy(orbitPosition(azimuth, elevation, controls.target, keep ?? fitDistance() * (home.distance ?? 1)));
    if (keepPose && keepPosition) { controls.target.copy(keepTarget); camera.position.copy(keepPosition); }
    controls.minDistance = minDistance ?? fitDistance() * .25; controls.maxDistance = fitDistance() * 1.8;
    controls.update();
    renderer.shadowMap.needsUpdate = true;
    draw();
  }

  controls.addEventListener('change', draw);
  new ResizeObserver(resize).observe(frame);
  canvas.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: [-.14, 0], ArrowRight: [.14, 0], ArrowUp: [0, .12], ArrowDown: [0, -.12] };
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      zoom(event.key === '-' ? 1 / 1.18 : 1.18);
    } else if (event.key === '0' || event.key === 'Home') {
      event.preventDefault();
      fitView();
    } else if (offsets[event.key]) {
      event.preventDefault();
      const [horizontal, vertical] = offsets[event.key];
      orbit(controls.getAzimuthalAngle() + horizontal, Three.MathUtils.clamp(Math.PI / 2 - controls.getPolarAngle() + vertical, .06, 1.55));
    }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    canvas.hidden = true;
    overlay.layer.hidden = true;
    onError?.();
  });
  resize();
  return {
    replace, refreshLighting, zoom, fitView, flyTo,
    top: () => flyTo({ azimuth: 0, elevation: Math.PI / 2 - .002 }),
    setTime: key => { const state = stage.setTime(key); draw(); return state; },
    setHotspots: list => { overlay.setHotspots(list); draw(); },
    selectHotspot: (index, silent = false) => overlay.select(index, { silent }),
    say: overlay.say, draw, clearHotspot: overlay.clear, markTime: overlay.setTime,
    // Flat gradient sky for baked models, whose own textures already hold the light.
    setBackdrop: (top, horizon) => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, top); grad.addColorStop(.5, horizon); grad.addColorStop(1, horizon); g.fillStyle = grad; g.fillRect(0, 0, 4, 256); const t = new Three.CanvasTexture(c); t.mapping = Three.EquirectangularReflectionMapping; t.colorSpace = Three.SRGBColorSpace; scene.background?.isCanvasTexture && scene.background.dispose(); scene.background = t; scene.backgroundBlurriness = 0; renderer.toneMapping = Three.NoToneMapping; draw(); },
    pose: () => ({ position: camera.position.toArray(), target: controls.target.toArray() }),
    showGround: visible => { stage.ground.visible = visible; stage.gridLines.visible = visible && grid; draw(); }, quality: () => (degraded ? 'low' : 'high'),
  };
}

export function addBlock(root, material, size, position) {
  const mesh = new Three.Mesh(new Three.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

// Kept for older callers: the ground and its shadows now come from the stage itself.
export function stageGrid() {}

export { Three, materials };
