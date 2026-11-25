// Barchinet World prototype: real-time view of the Courtyard studio, the fictional Los Angeles office.
// Four models, one per light state, share geometry, node names and UVs; only their textures differ.
// The light was path-traced in Blender Cycles and baked, already tone-mapped, into those textures. They are shown
// untouched: unlit materials, tone mapping off, no scene lights, no fog, no environment reflection.
// The first state loaded builds the scene. Switching state swaps textures only, so camera and hidden layers stay.
// Each model file is fetched on demand and its bytes are cached; only one state's textures are held on the GPU.
import * as T from './lib/three.mjs';
import { fetchWithProgress, readScene, readTextures } from './glb.mjs';
import { STATES, ANCHORS, ANCHOR_AT, modelUrl } from './studio.mjs';

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGL2RenderingContext && c.getContext('webgl2')); } catch { return false; }
}

const skyVertex = 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const skyFragment = `varying vec3 vDir; uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround;
void main(){ float h = vDir.y; vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h,0.0,1.0), 0.5)) : mix(uHorizon, uGround, clamp(-h*8.0,0.0,1.0)); gl_FragColor = vec4(c, 1.0); }`;

export class OfficeScene {
  constructor(host, { state = 'winter-noon', onProgress = () => {}, onReady = () => {}, onError = () => {}, onFrame = () => {}, onState = () => {}, reducedMotion = false } = {}) {
    Object.assign(this, { host, onProgress, onReady, onError, onFrame, onState, reducedMotion });
    this.disposed = false; this.needs = false; this.yaw = 0; this.pitch = 0; this.tween = null; this.ready = false;
    this.state = null; this.wanted = state; this.bytes = new Map(); this.textures = null; this.hidden = new Set(); this.anchorId = 'entry';
    try { this.init(); } catch (err) { this.fail(err); }
  }

  fail(err) { if (this.disposed) return; console.warn('[Barchinet World] 3D unavailable:', err); this.dispose(); this.onError(err); }

  init() {
    const small = this.small = Math.min(window.innerWidth, window.innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
    const r = this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.NoToneMapping;
    const cv = this.canvas = r.domElement;
    cv.className = 'bw-canvas'; cv.tabIndex = 0; cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Interactive 3D view of the Courtyard studio, a fictional Los Angeles office, with baked light. Drag or use the arrow keys to look around, plus and minus to zoom. Every action is also available as a button.');
    this.host.prepend(cv);
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.fail(new Error('WebGL context lost')); });
    this.scene = new T.Scene();
    this.fov = small ? 68 : 60;
    this.camera = new T.PerspectiveCamera(this.fov, 1.6, 0.06, 600);
    this.skyUniforms = { uTop: { value: new T.Color() }, uHorizon: { value: new T.Color() }, uGround: { value: new T.Color() } };
    this.sky = new T.Mesh(new T.SphereGeometry(400, 32, 16), new T.ShaderMaterial({ uniforms: this.skyUniforms, vertexShader: skyVertex, fragmentShader: skyFragment, side: T.BackSide, depthWrite: false, fog: false, toneMapped: false }));
    this.sky.frustumCulled = false; this.sky.renderOrder = -1; this.scene.add(this.sky);
    this.bind();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.host);
    this.resize(); this.setState(this.wanted);
  }

  // Fetch a state's model once and keep its bytes.
  fetchState(state, progress) {
    if (!this.bytes.has(state)) {
      const p = fetchWithProgress(new URL(`./${modelUrl(state)}`, import.meta.url), progress);
      p.catch(() => this.bytes.delete(state));
      this.bytes.set(state, p);
    }
    return this.bytes.get(state);
  }

  async setState(state) {
    if (!STATES[state] || this.disposed) return;
    this.wanted = state;
    if (state === this.state) return;
    const first = !this.ready;
    this.onState({ state, loading: true, first });
    try {
      const buffer = await this.fetchState(state, p => { if (this.wanted === state) this.onProgress(p, state); });
      if (this.disposed || this.wanted !== state) return;
      if (!this.model) {                                    // the first model that arrives supplies the geometry
        this.model = readScene(buffer);
        this.anchors = { ...Object.fromEntries(Object.entries(ANCHOR_AT).map(([k, at]) => [k, { at }])), ...this.model.anchors };
        this.scene.add(this.model.root);
        for (const name of this.hidden) if (this.model.layers[name]) this.model.layers[name].visible = false;
      }
      const edge = this.small ? 1024 : 0;
      const textures = await readTextures(buffer, { maxAnisotropy: Math.min(8, this.renderer.capabilities.getMaxAnisotropy()), maxEdge: edge });
      if (this.disposed || this.wanted !== state) { for (const t of textures.values()) { t.image?.close?.(); t.dispose(); } return; }
      for (const m of this.model.materials) if (m.userData.image && textures.has(m.userData.image)) { m.map = textures.get(m.userData.image); m.needsUpdate = true; }
      if (this.textures) for (const t of this.textures.values()) { t.dispose(); t.image?.close?.(); }
      this.textures = textures; this.state = state;
      const sky = STATES[state].sky; this.skyUniforms.uTop.value.setRGB(...sky[0]); this.skyUniforms.uHorizon.value.setRGB(...sky[1]); this.skyUniforms.uGround.value.setRGB(...sky[2]);
      if (first) { this.ready = true; this.goTo(this.anchorId, true); }
      this.render();
      this.onState({ state, loading: false, first });
      if (first) this.onReady();
    } catch (err) {
      if (first) this.fail(err); else { this.wanted = this.state; this.onState({ state, loading: false, failed: true }); }
    }
  }

  bind() {
    const cv = this.canvas, pointers = new Map(); let drag = null, pinch = 0;
    cv.addEventListener('pointerdown', e => {
      pointers.set(e.pointerId, e); cv.setPointerCapture(e.pointerId);
      if (pointers.size === 1) { drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; cv.dataset.grabbing = ''; }
      else { drag = null; const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
    });
    cv.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, e);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pinch) this.zoom((pinch - d) * 0.12); pinch = d; return; }
      if (drag) { const k = 0.0042 * this.camera.fov / 60; this.look(drag.yaw + (e.clientX - drag.x) * k, drag.pitch + (e.clientY - drag.y) * k); }
    });
    const end = e => { pointers.delete(e.pointerId); drag = null; pinch = 0; delete cv.dataset.grabbing; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', e => { if (!e.ctrlKey && document.activeElement !== cv) return; e.preventDefault(); this.zoom(e.deltaY * 0.03); }, { passive: false });
    cv.addEventListener('keydown', e => {
      const step = 0.09, m = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
      if (m) { e.preventDefault(); this.look(this.yaw + m[0], this.pitch + m[1]); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoom(-6); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoom(6); }
      else if (e.key === 'Home') { e.preventDefault(); this.camera.fov = this.fov; this.camera.updateProjectionMatrix(); this.look(0, 0); }
    });
  }

  look(yaw, pitch) { this.yaw = Math.max(-3.1, Math.min(3.1, yaw)); this.pitch = Math.max(-0.7, Math.min(0.7, pitch)); this.placeCamera(); this.invalidate(); }
  nudge(dyaw) { this.look(this.yaw + dyaw, this.pitch); }
  zoom(delta) { this.camera.fov = Math.max(28, Math.min(80, this.camera.fov + delta)); this.camera.updateProjectionMatrix(); this.invalidate(); }

  placeCamera() {
    if (!this.pose) return;
    const { pos, dir } = this.pose, base = Math.atan2(dir.x, dir.z), elev = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    const a = base + this.yaw, b = Math.max(-1.5, Math.min(1.3, elev + this.pitch));
    this.camera.position.copy(pos);
    this.camera.lookAt(pos.x + Math.sin(a) * Math.cos(b), pos.y + Math.sin(b), pos.z + Math.cos(a) * Math.cos(b));
  }

  // Fly to an anchor. The camera position and what stays hidden are kept across light states.
  goTo(id, instant = false) {
    const a = ANCHORS[id]; if (!a) return; this.anchorId = id;
    const target = a.look || this.anchors?.[id]?.at || ANCHOR_AT[id];
    const pos = new T.Vector3(...a.pos), dir = new T.Vector3(...target).sub(pos).normalize();
    this.camera.fov = this.fov; this.camera.updateProjectionMatrix();
    if (instant || this.reducedMotion || !this.pose) { this.pose = { pos, dir }; this.yaw = 0; this.pitch = 0; this.tween = null; this.placeCamera(); this.invalidate(); return; }
    const from = { pos: this.camera.position.clone(), dir: this.camera.getWorldDirection(new T.Vector3()) };
    this.tween = { from, to: { pos, dir }, start: performance.now(), ms: 1300 }; this.yaw = 0; this.pitch = 0; this.invalidate();
  }

  setLayer(name, visible) {
    if (visible) this.hidden.delete(name); else this.hidden.add(name);
    if (this.model?.layers[name]) { this.model.layers[name].visible = visible; this.invalidate(); }
  }

  resize() {
    if (this.disposed) return;
    const w = Math.max(2, this.host.clientWidth), h = Math.max(2, this.host.clientHeight);
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.invalidate();
  }

  invalidate() { if (this.needs || this.disposed) return; this.needs = true; this.raf = requestAnimationFrame(() => { this.needs = false; this.render(); }); }

  render() {
    if (this.disposed || !this.ready) return;
    if (this.tween) {
      const t = Math.min(1, (performance.now() - this.tween.start) / this.tween.ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.pose = { pos: this.tween.from.pos.clone().lerp(this.tween.to.pos, e), dir: this.tween.from.dir.clone().lerp(this.tween.to.dir, e).normalize() };
      this.placeCamera();
      if (t >= 1) { this.pose = this.tween.to; this.tween = null; this.placeCamera(); } else this.invalidate();
    }
    this.sky.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
    this.onFrame(this);
  }

  // Screen position (0..1) of an anchor, or null when it is behind the camera or outside the frame.
  project(id) {
    const at = this.anchors?.[id]?.at; if (!at) return null;
    const cam = new T.Vector3(...at).applyMatrix4(this.camera.matrixWorldInverse);
    if (cam.z > -0.5) return null;
    const v = new T.Vector3(...at).project(this.camera);
    if (v.z > 1 || v.z < -1 || Math.abs(v.x) > 0.94 || Math.abs(v.y) > 0.86) return null;
    return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
  }

  dispose() {
    if (this.disposed) return; this.disposed = true;
    cancelAnimationFrame(this.raf); this.resizeObserver?.disconnect();
    this.scene?.traverse(o => { o.geometry?.dispose?.(); if (o.material) for (const m of [].concat(o.material)) m.dispose?.(); });
    if (this.textures) for (const t of this.textures.values()) { t.dispose(); t.image?.close?.(); }
    this.bytes.clear();
    try { this.renderer?.dispose(); this.renderer?.forceContextLoss?.(); } catch { /* ignore */ }
    this.canvas?.remove();
  }
}
