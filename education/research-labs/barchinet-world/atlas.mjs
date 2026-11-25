// Barchinet World prototype: a small dot-matrix globe drawn on a 2D canvas (no WebGL needed).
// The land outlines are deliberately coarse, hand-simplified shapes for orientation only. Not a map for navigation.
const LAND = [
  [[-168, 66], [-156, 71], [-128, 70], [-110, 68], [-95, 72], [-82, 73], [-78, 62], [-64, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 20], [-92, 18], [-88, 21], [-87, 16], [-83, 10], [-79, 9], [-85, 13], [-95, 16], [-105, 20], [-110, 23], [-114, 30], [-117, 32], [-122, 37], [-124, 43], [-124, 48], [-131, 55], [-140, 60], [-152, 59], [-160, 56], [-165, 60]],
  [[-55, 60], [-44, 60], [-22, 70], [-20, 80], [-40, 83], [-60, 82], [-72, 78], [-56, 70]],
  [[-80, 9], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-42, -23], [-48, -28], [-57, -37], [-65, -42], [-67, -55], [-73, -52], [-75, -45], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-78, 2]],
  [[-17, 21], [-13, 28], [-6, 35], [10, 37], [11, 33], [20, 31], [32, 31], [35, 24], [43, 12], [51, 12], [45, 2], [40, -4], [40, -15], [35, -24], [28, -33], [19, -35], [15, -27], [12, -17], [13, -6], [9, 2], [5, 5], [-5, 5], [-12, 7], [-17, 14]],
  [[-9, 37], [-9, 43], [-2, 44], [-5, 48], [2, 51], [5, 54], [8, 57], [12, 56], [10, 54], [14, 54], [20, 55], [22, 59], [30, 60], [28, 66], [40, 67], [44, 66], [60, 69], [60, 55], [50, 46], [40, 47], [41, 42], [28, 41], [26, 37], [22, 37], [19, 42], [13, 45], [18, 40], [15, 38], [12, 42], [8, 44], [3, 43], [0, 39], [-5, 36]],
  [[5, 58], [8, 58], [12, 56], [13, 60], [18, 60], [22, 66], [28, 70], [20, 70], [13, 66], [5, 62]],
  [[-5, 50], [1, 51], [0, 54], [-2, 58], [-6, 58], [-5, 54], [-3, 53]],
  [[60, 55], [60, 69], [75, 73], [100, 77], [115, 74], [140, 73], [160, 70], [180, 68], [178, 62], [163, 58], [156, 51], [142, 54], [135, 44], [129, 35], [126, 35], [122, 40], [118, 38], [122, 31], [120, 25], [110, 21], [108, 16], [109, 11], [104, 9], [100, 13], [99, 7], [103, 1], [98, 8], [97, 16], [92, 21], [88, 21], [80, 15], [77, 8], [73, 17], [70, 22], [62, 25], [57, 26], [52, 28], [48, 30], [51, 25], [56, 24], [59, 22], [55, 17], [45, 13], [43, 15], [39, 21], [35, 28], [36, 36], [28, 37], [28, 41], [41, 42], [40, 47], [50, 46]],
  [[130, 32], [136, 34], [140, 36], [142, 40], [141, 45], [138, 37], [132, 35]],
  [[95, 5], [106, -6], [101, -2]], [[109, 1], [118, 5], [117, -3], [111, -3]], [[131, -1], [141, -3], [150, -7], [141, -9], [134, -4]],
  [[114, -22], [122, -17], [130, -12], [137, -12], [140, -17], [142, -11], [146, -19], [153, -27], [150, -37], [144, -38], [138, -35], [131, -31], [124, -33], [115, -34]],
  [[173, -41], [178, -38], [174, -36]], [[167, -46], [172, -41], [174, -42], [170, -46]], [[44, -25], [50, -15], [49, -12], [44, -17]]
];
const RAD = Math.PI / 180;

function inside(lon, lat, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
let DOTS = null;
function landDots() {
  if (DOTS) return DOTS; DOTS = [];
  for (let lat = -84; lat <= 84; lat += 3) {
    const step = 3 / Math.max(0.25, Math.cos(lat * RAD));
    for (let lon = -180; lon < 180; lon += step) if (lat < -70 || LAND.some(p => inside(lon, lat, p))) DOTS.push(toVec(lon, lat));
  }
  return DOTS;
}
const toVec = (lon, lat) => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];

export class Atlas {
  constructor(canvas, { pins = [], onMove = () => {}, reducedMotion = false } = {}) {
    Object.assign(this, { canvas, pins, onMove, reducedMotion });
    this.ctx = canvas.getContext('2d'); this.lon = -60; this.lat = 24; this.arc = null; this.active = null;
    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, lon: this.lon, lat: this.lat }; canvas.setPointerCapture(e.pointerId); this.stop(); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; const k = 180 / (this.radius * Math.PI); this.set(drag.lon - (e.clientX - drag.x) * k, drag.lat + (e.clientY - drag.y) * k); });
    const end = () => { drag = null; }; canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('keydown', e => {
      const m = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
      if (m) { e.preventDefault(); this.stop(); this.set(this.lon + m[0], this.lat + m[1]); }
    });
    this.observer = new ResizeObserver(() => this.draw()); this.observer.observe(canvas);
    this.draw();
  }
  stop() { cancelAnimationFrame(this.raf); }
  set(lon, lat) { this.lon = ((lon + 540) % 360) - 180; this.lat = Math.max(-60, Math.min(70, lat)); this.draw(); }
  rotateBy(dlon) { this.flyTo(this.lon + dlon, this.lat); }
  flyTo(lon, lat) {
    this.stop();
    if (this.reducedMotion) return this.set(lon, lat);
    const from = { lon: this.lon, lat: this.lat }, d = ((lon - from.lon + 540) % 360) - 180, start = performance.now();
    const tick = now => { const t = Math.min(1, (now - start) / 900), e = 1 - Math.pow(1 - t, 3); this.set(from.lon + d * e, from.lat + (lat - from.lat) * e); if (t < 1) this.raf = requestAnimationFrame(tick); };
    this.raf = requestAnimationFrame(tick);
  }
  // Rotate a unit vector into view space. Returns [x, y, depth]; depth > 0 faces the viewer.
  view(v) {
    const a = -this.lon * RAD, b = this.lat * RAD;
    const x = v[0] * Math.cos(a) + v[2] * Math.sin(a), z = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
    return [x, v[1] * Math.cos(b) - z * Math.sin(b), v[1] * Math.sin(b) + z * Math.cos(b)];
  }
  draw() {
    const cv = this.canvas, dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = this.ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const R = this.radius = Math.min(w, h) * 0.43, cx = w / 2, cy = h / 2;
    const g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#2f6f66'); g.addColorStop(1, '#17403c');
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.lineWidth = 1; c.strokeStyle = 'rgba(232,238,170,.5)'; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.09)';
    for (let lon = -180; lon < 180; lon += 30) this.line(Array.from({ length: 37 }, (_, i) => toVec(lon, -90 + i * 5)), cx, cy, R);
    for (let lat = -60; lat <= 60; lat += 30) this.line(Array.from({ length: 73 }, (_, i) => toVec(-180 + i * 5, lat)), cx, cy, R);
    for (const d of landDots()) {
      const v = this.view(d); if (v[2] <= 0.02) continue;
      c.fillStyle = `rgba(247,245,239,${0.25 + 0.6 * v[2]})`;
      c.beginPath(); c.arc(cx + v[0] * R, cy - v[1] * R, 1.1 + 0.9 * v[2], 0, Math.PI * 2); c.fill();
    }
    if (this.arc) {
      const [a, b] = this.arc.map(p => toVec(p.lon, p.lat)), dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], om = Math.acos(dot), pts = [];
      for (let i = 0; i <= 48; i++) { const t = i / 48, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om), lift = 1 + 0.08 * Math.sin(Math.PI * t); pts.push([(a[0] * s1 + b[0] * s2) * lift, (a[1] * s1 + b[1] * s2) * lift, (a[2] * s1 + b[2] * s2) * lift]); }
      c.strokeStyle = '#f0a37f'; c.lineWidth = 2; c.setLineDash([5, 5]); this.line(pts, cx, cy, R); c.setLineDash([]);
    }
    this.onMove(this.pins.map(p => { const v = this.view(toVec(p.lon, p.lat)); return { id: p.id, visible: v[2] > 0.12, x: (cx + v[0] * R) / w, y: (cy - v[1] * R) / h }; }));
  }
  line(vecs, cx, cy, R) {
    const c = this.ctx; let open = false; c.beginPath();
    for (const p of vecs) { const v = this.view(p); if (v[2] <= 0) { open = false; continue; } const x = cx + v[0] * R, y = cy - v[1] * R; if (open) c.lineTo(x, y); else { c.moveTo(x, y); open = true; } }
    c.stroke();
  }
  destroy() { this.stop(); this.observer.disconnect(); }
}
