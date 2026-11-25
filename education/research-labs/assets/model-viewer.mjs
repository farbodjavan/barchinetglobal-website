import * as Three from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js?v=2';

const defaultAzimuth = Math.PI * .13;
const defaultElevation = Math.PI * .22;

export function createModelViewer(frame, { onError, enablePan = false } = {}) {
  const canvas = frame.querySelector('canvas');
  let renderer;
  try {
    renderer = new Three.WebGLRenderer({ canvas, antialias: true });
  } catch {
    canvas.hidden = true;
    onError?.();
    return null;
  }
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setClearColor('#18312f');
  renderer.toneMapping = Three.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.27;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = Three.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Three.Scene();
  const camera = new Three.OrthographicCamera(-1, 1, 1, -1, .01, 4000);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = enablePan;
  controls.minZoom = .6;
  controls.maxZoom = 3.4;
  controls.maxPolarAngle = Math.PI / 2 - .035;
  const sky = new Three.HemisphereLight('#fff6df', '#65847e', 2.35);
  const sun = new Three.DirectionalLight('#fff1d1', 2.65);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.bias = -.00014;
  const fill = new Three.DirectionalLight('#b9e5e7', 1.05);
  fill.position.set(4, 3, -8);
  const model = new Three.Group();
  scene.add(sky, sun, fill, model);
  let radius = 5;
  let modelCenter = 0;
  let height = 0;
  let width = 0;

  function draw() {
    if (!width || !height) return;
    renderer.render(scene, camera);
  }

  function resize() {
    width = frame.clientWidth;
    height = frame.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const halfHeight = radius / Math.min(1, aspect);
    camera.left = -halfHeight * aspect;
    camera.right = -camera.left;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }

  function orbit(azimuth, elevation) {
    const distance = radius * 3 + 3;
    const horizontal = Math.cos(elevation) * distance;
    camera.position.copy(controls.target).add(new Three.Vector3(
      Math.sin(azimuth) * horizontal,
      Math.sin(elevation) * distance,
      Math.cos(azimuth) * horizontal,
    ));
    controls.update();
    draw();
  }

  function zoom(ratio) {
    camera.zoom = Three.MathUtils.clamp(camera.zoom * ratio, controls.minZoom, controls.maxZoom);
    camera.updateProjectionMatrix();
    draw();
  }

  function fitView() {
    controls.target.set(0, modelCenter, 0);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    orbit(defaultAzimuth, defaultElevation);
    resize();
  }

  function refreshLighting() {
    renderer.shadowMap.needsUpdate = true;
    draw();
  }

  function replace(content, { size, center = 0 }) {
    const resources = new Set();
    model.traverse(({ geometry, material }) => {
      if (geometry) resources.add(geometry);
      if (material) resources.add(material);
    });
    model.clear();
    for (const resource of resources) resource.dispose();
    model.add(content);
    radius = Math.max(1, size);
    modelCenter = center;
    sun.position.set(-radius * .8, radius * 1.35, radius * .65);
    sun.shadow.camera.left = -radius;
    sun.shadow.camera.right = radius;
    sun.shadow.camera.top = radius;
    sun.shadow.camera.bottom = -radius;
    sun.shadow.camera.far = radius * 5;
    sun.shadow.camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
    const azimuth = controls.getAzimuthalAngle();
    const elevation = Math.PI / 2 - controls.getPolarAngle();
    controls.target.set(0, center, 0);
    orbit(azimuth, elevation);
    resize();
  }

  controls.addEventListener('change', draw);
  new ResizeObserver(resize).observe(frame);
  canvas.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: [-.14, 0], ArrowRight: [.14, 0], ArrowUp: [0, .12], ArrowDown: [0, -.12] };
    if (event.key === '+' || event.key === '-') {
      event.preventDefault();
      zoom(event.key === '+' ? 1.18 : 1 / 1.18);
    } else if (offsets[event.key]) {
      event.preventDefault();
      const [horizontal, vertical] = offsets[event.key];
      orbit(controls.getAzimuthalAngle() + horizontal, Three.MathUtils.clamp(Math.PI / 2 - controls.getPolarAngle() + vertical, .06, 1.55));
    }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    canvas.hidden = true;
    onError?.();
  });
  fitView();
  return { replace, refreshLighting, zoom, fitView, top: () => orbit(0, Math.PI / 2 - .002) };
}

export function addBlock(root, material, size, position) {
  const mesh = new Three.Mesh(new Three.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

export function stageGrid(root, size, divisions) {
  const surface = new Three.Mesh(new Three.PlaneGeometry(size, size), new Three.ShadowMaterial({ opacity: .34 }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -.1;
  surface.receiveShadow = true;
  const grid = new Three.GridHelper(size, divisions, '#587f77', '#3d5d56');
  grid.position.y = -.09;
  root.add(surface, grid);
}

export { Three };
