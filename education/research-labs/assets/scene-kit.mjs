// Shared real-time look for Research Labs 3D views (three.js r180, no extra downloads).
// Everything here is generated in the browser: an HDR sky used for both background and reflections,
// a ground that meets the horizon, a soft sun shadow plus an overhead "sky" shadow that stands in for
// ambient occlusion at contacts, procedural surface textures, filmic tone mapping, smooth camera moves,
// hotspots, a dismissible first-run hint and a low-quality path for slow devices.
// This is physically based shading with one bounce-less sun; it is not path-traced light.
import * as Three from './vendor/three/three.module.min.js';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function pickQuality() {
  if (typeof location !== 'undefined') {
    const asked = new URLSearchParams(location.search).get('quality');
    if (asked === 'low' || asked === 'high') return asked;
  }
  const nav = typeof navigator === 'undefined' ? {} : navigator;
  const small = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 480;
  return (nav.deviceMemory && nav.deviceMemory <= 4) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || small ? 'low' : 'high';
}

/* ---------- Time of day ---------- */
export const dayStates = {
  morning: { label: 'Morning', hour: '8:00', elevation: 22, azimuth: 100, warmth: .55, strength: 5.2 },
  noon: { label: 'Midday', hour: '12:30', elevation: 62, azimuth: 175, warmth: .08, strength: 7 },
  afternoon: { label: 'Afternoon', hour: '16:00', elevation: 34, azimuth: 245, warmth: .35, strength: 6 },
  dusk: { label: 'Dusk', hour: '18:45', elevation: 7, azimuth: 275, warmth: 1, strength: 3.2 },
};
export function sunDirection(state) {
  const el = Three.MathUtils.degToRad(state.elevation), az = Three.MathUtils.degToRad(state.azimuth);
  // azimuth measured clockwise from north (-Z); +X is east.
  return new Three.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Linear-light equirectangular sky. Lower hemisphere carries the ground colour so the horizon is seamless.
export function skyTexture(state, ground = [.5, .47, .4]) {
  const w = 256, h = 128, data = new Float32Array(w * h * 4), sun = sunDirection(state), warm = state.warmth;
  const zenith = mix([.13, .30, .70], [.10, .14, .32], warm * warm), horizon = mix([.78, .87, .97], [1.25, .62, .30], warm * warm);
  const dir = new Three.Vector3();
  for (let y = 0; y < h; y++) {
    const phi = (y + .5) / h * Math.PI; // 0 = straight up after the flip below
    for (let x = 0; x < w; x++) {
      const theta = (x + .5) / w * Math.PI * 2;
      dir.set(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      let c;
      if (dir.y >= 0) {
        c = mix(horizon, zenith, Math.pow(dir.y, .42));
        const near = Math.max(0, dir.dot(sun));
        const glow = Math.pow(near, 24) * (1.2 + warm * 1.8), disc = near > .9993 ? 60 : Math.pow(near, 900) * 40;
        c = [c[0] + glow * 1.0 + disc, c[1] + glow * (.82 - warm * .25) + disc * (.94 - warm * .2), c[2] + glow * (.6 - warm * .4) + disc * (.82 - warm * .45)];
      } else {
        c = mix(mix(horizon, ground, .55), ground, Math.min(1, -dir.y * 6)).map(v => v * (.55 + .45 * Math.min(1, state.elevation / 40 + .35)));
      }
      const i = ((h - 1 - y) * w + x) * 4; // row 0 is the bottom for DataTexture
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 1;
    }
  }
  const texture = new Three.DataTexture(data, w, h, Three.RGBAFormat, Three.FloatType);
  texture.mapping = Three.EquirectangularReflectionMapping;
  texture.colorSpace = Three.LinearSRGBColorSpace;
  texture.magFilter = texture.minFilter = Three.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/* ---------- Procedural surfaces ---------- */
function canvasTexture(size, paint, repeat = 1) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  paint(canvas.getContext('2d'), size);
  const texture = new Three.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = Three.RepeatWrapping; texture.repeat.set(repeat, repeat);
  texture.colorSpace = Three.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cache = new Map();
function surfaceMaps(kind) {
  if (cache.has(kind)) return cache.get(kind);
  seed = 7 + kind.length * 131;
  const paint = {
    grain(g, s) { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let i = 0; i < 900; i++) { const v = 96 + rand() * 64 | 0; g.strokeStyle = `rgba(${v},${v},${v},.5)`; g.lineWidth = .6 + rand() * 1.6; const y = rand() * s, wob = (rand() - .5) * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(s * .3, y + wob, s * .7, y - wob, s, y); g.stroke(); } },
    speckle(g, s) { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let i = 0; i < 9000; i++) { const v = 90 + rand() * 76 | 0; g.fillStyle = `rgba(${v},${v},${v},.55)`; const r = rand() * 1.8; g.fillRect(rand() * s, rand() * s, r, r); } for (let i = 0; i < 26; i++) { const v = 100 + rand() * 50 | 0; g.fillStyle = `rgba(${v},${v},${v},.08)`; g.beginPath(); g.arc(rand() * s, rand() * s, 14 + rand() * 46, 0, 7); g.fill(); } },
    weave(g, s) { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 4) for (let x = 0; x < s; x += 4) { const v = ((x + y) / 4 % 2 ? 112 : 142) + rand() * 14 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 4, 4); } },
    tile(g, s) { g.fillStyle = '#868686'; g.fillRect(0, 0, s, s); const n = 4, t = s / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = 120 + rand() * 26 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x * t + 2, y * t + 2, t - 4, t - 4); } },
  }[kind];
  const maps = canvasTexture(256, paint);
  cache.set(kind, maps);
  return maps;
}
function surface(kind, color, { roughness, metalness = 0, repeat = 2, bump = .012, envMapIntensity = 1 } = {}) {
  const base = surfaceMaps(kind);
  const map = base.clone(); map.repeat.set(repeat, repeat); map.needsUpdate = true;
  const tone = new Three.Color(color).multiplyScalar(1.9); // the grey texture averages ~0.5
  return new Three.MeshStandardMaterial({ color: tone, map, bumpMap: map, bumpScale: bump * 40, roughness, metalness, envMapIntensity });
}
export const materials = {
  timber: (color = '#b98a54') => surface('grain', color, { roughness: .58, repeat: 1, bump: .01 }),
  concrete: (color = '#b9b6ad') => surface('speckle', color, { roughness: .86, repeat: 2, bump: .02 }),
  plaster: (color = '#e7dfcf') => surface('speckle', color, { roughness: .93, repeat: 3, bump: .008 }),
  stone: (color = '#9aa79a') => surface('tile', color, { roughness: .78, repeat: 3, bump: .03 }),
  fabric: (color = '#aa624d') => surface('weave', color, { roughness: .95, repeat: 6, bump: .02 }),
  foliage: (color = '#5f7f56') => surface('speckle', color, { roughness: .9, repeat: 4, bump: .05 }),
  metal: (color = '#8d949a') => new Three.MeshStandardMaterial({ color, roughness: .34, metalness: 1, envMapIntensity: 1.15 }),
  paint: (color = '#ffffff') => new Three.MeshStandardMaterial({ color, roughness: .62 }),
  glass: (tint = '#bfe0e6') => new Three.MeshPhysicalMaterial({ color: tint, roughness: .04, metalness: 0, transparent: true, opacity: .28, envMapIntensity: 1.6, specularIntensity: 1, depthWrite: false }),
};

/* ---------- Stage: sky, ground, sun ---------- */
export function createStage(renderer, scene, { quality = pickQuality(), time = 'afternoon', groundColor = '#c9c6bd', grid = false } = {}) {
  const high = quality === 'high';
  renderer.outputColorSpace = Three.SRGBColorSpace;
  renderer.toneMapping = Three.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = Three.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, high ? 2 : 1));
  const pmrem = new Three.PMREMGenerator(renderer);
  const sun = new Three.DirectionalLight('#fff', 3);
  sun.castShadow = true; sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
  sun.shadow.radius = high ? 5 : 2; sun.shadow.blurSamples = high ? 16 : 8; sun.shadow.bias = -.0002; sun.shadow.normalBias = .03;
  // Overhead light that only exists to darken what the sky cannot see: a cheap stand-in for ambient occlusion.
  const overhead = new Three.DirectionalLight('#dfe9ff', high ? .55 : 0);
  overhead.castShadow = high; overhead.shadow.mapSize.set(1024, 1024); overhead.shadow.radius = 14; overhead.shadow.blurSamples = 16; overhead.shadow.bias = -.0004; overhead.shadow.normalBias = .05;
  const groundSkin = surface('speckle', groundColor, { roughness: .97, repeat: 24, bump: 0, envMapIntensity: .5 });
  groundSkin.bumpMap = null;
  const fade = canvasTexture(128, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, s * .12, s / 2, s / 2, s / 2); r.addColorStop(0, '#fff'); r.addColorStop(.7, '#fff'); r.addColorStop(1, '#000'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  fade.colorSpace = Three.NoColorSpace; fade.wrapS = fade.wrapT = Three.ClampToEdgeWrapping;
  groundSkin.alphaMap = fade; groundSkin.transparent = true;
  const ground = new Three.Mesh(new Three.CircleGeometry(1, 64), groundSkin);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.renderOrder = -1;
  // The alpha map uses the disc's own 0..1 UVs; the surface texture is scaled through its repeat.
  const gridLines = new Three.GridHelper(1, 20, '#5d6b63', '#7c867d');
  gridLines.material.transparent = true; gridLines.material.opacity = .22; gridLines.visible = grid;
  scene.add(sun, sun.target, overhead, overhead.target, ground, gridLines);
  let radius = 5, envTarget, state;
  const groundLinear = new Three.Color(groundColor).convertSRGBToLinear();

  function setTime(key) {
    state = dayStates[key] || dayStates.afternoon;
    const sky = skyTexture(state, [groundLinear.r, groundLinear.g, groundLinear.b]);
    const next = pmrem.fromEquirectangular(sky); sky.dispose();
    envTarget?.dispose(); envTarget = next;
    scene.environment = next.texture; scene.background = next.texture;
    scene.backgroundBlurriness = .04; scene.environmentIntensity = 1.1; scene.backgroundIntensity = 1;
    sun.color.set(mix([1, .97, .9], [1, .62, .36], state.warmth).reduce((hex, v) => (hex << 8) + Math.round(Math.min(1, v) * 255), 0));
    sun.intensity = state.strength;
    renderer.toneMappingExposure = state.elevation < 12 ? 1.2 : 1;
    place();
    return state;
  }
  function place() {
    const dir = sunDirection(state);
    sun.position.copy(dir).multiplyScalar(radius * 3); sun.target.position.set(0, 0, 0);
    overhead.position.set(radius * .08, radius * 3, radius * .05);
    for (const light of [sun, overhead]) {
      const cam = light.shadow.camera, r = radius * 1.35;
      cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r; cam.near = .1; cam.far = radius * 7; cam.updateProjectionMatrix();
    }
    ground.scale.setScalar(radius * 14); gridLines.scale.setScalar(Math.ceil(radius * 2.4));
    gridLines.position.y = .004;
    renderer.shadowMap.needsUpdate = true;
  }
  function setRadius(next, groundY = 0) { radius = Math.max(1, next); ground.position.y = groundY - .002; gridLines.position.y = groundY + .004; place(); }
  function degrade() { // called when frames are slow
    renderer.setPixelRatio(1); overhead.castShadow = false; overhead.intensity = 0; sun.shadow.radius = 2;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null; renderer.shadowMap.needsUpdate = true;
  }
  setTime(time);
  return { setTime, setRadius, degrade, sun, ground, gridLines, get state() { return state; }, quality, dispose() { envTarget?.dispose(); pmrem.dispose(); } };
}

/* ---------- Camera moves ---------- */
export function flyCamera(camera, controls, to, draw, duration = 900) {
  const from = { position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom };
  const end = { position: to.position, target: to.target || controls.target.clone(), zoom: to.zoom ?? camera.zoom };
  const apply = t => {
    camera.position.lerpVectors(from.position, end.position, t); controls.target.lerpVectors(from.target, end.target, t);
    camera.zoom = from.zoom + (end.zoom - from.zoom) * t; camera.updateProjectionMatrix(); controls.update(); draw();
  };
  cancelAnimationFrame(camera.userData.flight);
  if (reducedMotion() || duration <= 0) { apply(1); return; }
  const start = performance.now();
  const step = now => { const t = Math.min(1, (now - start) / duration), eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; apply(eased); if (t < 1) camera.userData.flight = requestAnimationFrame(step); };
  camera.userData.flight = requestAnimationFrame(step);
}

/* ---------- Overlay: hotspots, time of day, first-run hint ---------- */
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function createOverlay(frame, { purpose, tips = ['Drag to turn', 'Scroll or pinch to zoom', 'Arrow keys turn, + and − zoom'], storageKey, onTime, time, onHotspot, schematic } = {}) {
  frame.classList.add('sk-frame');
  const layer = document.createElement('div'); layer.className = 'sk-layer';
  layer.innerHTML = `<div class="sk-spots" role="group" aria-label="Guided points in the 3D view"></div>
<div class="sk-top">${purpose ? `<p class="sk-purpose">${escapeHtml(purpose)}</p>` : ''}<div class="sk-tools">${onTime ? `<div class="sk-time" role="group" aria-label="Time of day">${Object.entries(dayStates).map(([key, s]) => `<button type="button" data-time="${key}" aria-pressed="${key === time}" title="${s.label}, about ${s.hour}">${s.label}</button>`).join('')}</div>` : ''}<button type="button" class="sk-help" aria-expanded="false" aria-label="How to use this view">?</button></div></div>
<div class="sk-card" hidden><button type="button" class="sk-card-close" aria-label="Close this note">×</button><strong></strong><p></p></div>
<div class="sk-hint" role="note" hidden><strong>${escapeHtml(purpose || 'Explore the model')}</strong><ul>${tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul><button type="button" class="sk-hint-close">Got it</button></div>
${schematic ? `<p class="sk-schematic">${escapeHtml(schematic)}</p>` : ''}<p class="sk-live" role="status" aria-live="polite"></p>`;
  frame.append(layer);
  const hint = layer.querySelector('.sk-hint'), help = layer.querySelector('.sk-help'), card = layer.querySelector('.sk-card'), spotsBox = layer.querySelector('.sk-spots'), live = layer.querySelector('.sk-live');
  const seen = () => { try { return storageKey && localStorage.getItem(storageKey) === '1'; } catch { return false; } };
  const showHint = open => { hint.hidden = !open; help.setAttribute('aria-expanded', String(open)); if (!open) { try { if (storageKey) localStorage.setItem(storageKey, '1'); } catch { /* private mode */ } } };
  showHint(!seen());
  help.onclick = () => showHint(hint.hidden);
  layer.querySelector('.sk-hint-close').onclick = () => { showHint(false); help.focus(); };
  layer.querySelector('.sk-card-close').onclick = () => { card.hidden = true; for (const b of spotsBox.children) b.setAttribute('aria-pressed', 'false'); };
  layer.addEventListener('keydown', event => { if (event.key === 'Escape') { if (!card.hidden) layer.querySelector('.sk-card-close').click(); else if (!hint.hidden) showHint(false); } });
  for (const button of layer.querySelectorAll('[data-time]')) button.onclick = () => { for (const b of layer.querySelectorAll('[data-time]')) b.setAttribute('aria-pressed', String(b === button)); const s = onTime(button.dataset.time); live.textContent = `Light set to ${s.label.toLowerCase()}, about ${s.hour}.`; };
  let spots = [];
  function setHotspots(list) {
    spots = list; card.hidden = true;
    spotsBox.innerHTML = list.map((s, i) => `<button type="button" class="sk-spot" data-spot="${i}" aria-pressed="false" aria-label="${escapeHtml(s.label)}"><span aria-hidden="true">${i + 1}</span><em>${escapeHtml(s.label)}</em></button>`).join('');
    for (const button of spotsBox.children) button.onclick = () => select(Number(button.dataset.spot));
  }
  function select(index, { silent } = {}) {
    const spot = spots[index]; if (!spot) return;
    for (const b of spotsBox.children) b.setAttribute('aria-pressed', String(Number(b.dataset.spot) === index));
    card.hidden = false; card.querySelector('strong').textContent = spot.label; card.querySelector('p').textContent = spot.text || '';
    live.textContent = `${spot.label}. ${spot.text || ''}`;
    if (!silent) onHotspot?.(spot, index);
  }
  const point = new Three.Vector3();
  function project(camera) {
    const w = frame.clientWidth, h = frame.clientHeight;
    spots.forEach((spot, i) => {
      point.set(...spot.position).project(camera);
      const button = spotsBox.children[i], visible = point.z < 1 && Math.abs(point.x) < 1.05 && Math.abs(point.y) < 1.05;
      button.style.transform = `translate(${(point.x * .5 + .5) * w}px, ${(-point.y * .5 + .5) * h}px)`;
      button.classList.toggle('sk-off', !visible);
    });
  }
  return { setHotspots, select, project, say: text => { live.textContent = text; }, layer };
}

export { Three };
