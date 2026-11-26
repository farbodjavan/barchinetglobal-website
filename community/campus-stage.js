// The campus photograph as the page opening. One rendered photograph, treated like a plate in a publication:
// a very slow camera drift (Ken Burns), a soft parallax on the pointer, an eased move toward a chosen building,
// and drawing callouts (numbered marker, thin leader, compact label) that are real buttons or links.
// Time of day is a colour grade over the photograph until a render exists for each light.
// Shared by the Community page and the home page section.
import { plots, hall, inPicture, cropFor, daylightNow, heroImage } from './campus-data.js';

const ASPECT = 1.6; // the photograph is 16:10
const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const SVG = 'http://www.w3.org/2000/svg';

// A crop of the hero photograph around one building, cut by the browser from the single hero file.
export function buildingCrop(plot, alt = '', opts) {
  const c = cropFor(plot ?? 'hall', opts);
  const box = make('div', 'crop');
  box.style.aspectRatio = String(c.aspect);
  const img = make('img'); img.src = heroImage.src; img.alt = alt; img.loading = 'lazy'; img.decoding = 'async';
  img.width = heroImage.width; img.height = heroImage.height;
  img.style.width = 100 / c.w + '%'; img.style.left = -c.x / c.w * 100 + '%'; img.style.top = -c.y / c.h * 100 + '%';
  box.append(img);
  return box;
}
export function setCrop(box, plot, alt = '', opts) {
  const c = cropFor(plot ?? 'hall', opts); const img = box.querySelector('img');
  box.style.aspectRatio = String(c.aspect); img.alt = alt;
  img.style.width = 100 / c.w + '%'; img.style.left = -c.x / c.w * 100 + '%'; img.style.top = -c.y / c.h * 100 + '%';
}

function leader(dx, dy) {
  const s = Math.sign(dx) || 1;
  const svg = document.createElementNS(SVG, 'svg'); svg.setAttribute('class', 'lead'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '1'); svg.setAttribute('height', '1');
  const path = document.createElementNS(SVG, 'path');
  // From the edge of the marker, a straight diagonal, then a short shoulder to the label, as in a drawing callout.
  const len = Math.hypot(dx, dy), r = 9;
  path.setAttribute('d', 'M' + (dx / len * r).toFixed(1) + ' ' + (dy / len * r).toFixed(1) + 'L' + dx + ' ' + dy + 'h' + s * 12);
  svg.append(path);
  return svg;
}

export function mountCampus(stage, { projects = [], frame, kind = 'button', hrefFor, onChoose, onStatus, occluders = () => [] }) {
  const plate = stage.querySelector('.plate-inner'), list = stage.querySelector('.notes');
  const ui = { motion: true, selected: null, visible: true, size: { w: 1, h: 1 }, base: null, compact: false, light: 'day' };

  // ---- Callouts ----------------------------------------------------------------------------------------------
  // Drawn from the projects the page loaded; the picture is shown (with Barchinet hall only) before they arrive,
  // and stays that way when there are none.
  let notes = [];
  const hallLi = make('li', 'note-item hall to-left'); hallLi.setAttribute('aria-hidden', 'true');
  hallLi.style.setProperty('--lx', '-52px'); hallLi.style.setProperty('--ly', '-30px');
  hallLi.append(leader(-40, -30), make('span', 'mark dot'), make('span', 'note hall-note', 'Barchinet hall'));
  const hallAt = inPicture(hall.x, hall.y, hall.top - 0.6);
  function build(list_) {
    notes.forEach((n) => n.li.remove());
    notes = list_.filter((p) => plots[p.plot]).map(note);
    list.replaceChildren(...notes.map((n) => n.li), hallLi);
    if (ui.base) checkDensity();
    wake();
  }
  function note(p) {
    const pl = plots[p.plot];
    // A callout points away from the middle of the campus unless the project says otherwise.
    const [dx, dy] = p.lead ?? [inPicture(pl.x, pl.y, 0)[0] < 0.5 ? -36 : 36, -40]; const s = Math.sign(dx) || 1;
    const li = make('li', 'note-item' + (s < 0 ? ' to-left' : ''));
    li.style.setProperty('--lx', dx + s * 12 + 'px'); li.style.setProperty('--ly', dy + 'px');
    const el = make(kind === 'link' ? 'a' : 'button', 'note');
    if (kind === 'link') { el.href = hrefFor(p); } else { el.type = 'button'; el.setAttribute('aria-pressed', 'false'); }
    el.dataset.slug = p.slug;
    const name = make('span', 'note-name');
    name.append(make('span', 'visually-hidden', (kind === 'link' ? 'See project ' : 'Project ') + p.n + ': '), p.title);
    el.append(name);
    if (kind !== 'link') el.addEventListener('click', () => onChoose?.(ui.selected === p ? null : p, el));
    const mark = make('span', 'mark', String(p.n)); mark.setAttribute('aria-hidden', 'true');
    mark.addEventListener('click', () => el.click());
    const on = (v) => () => li.classList.toggle('is-on', v);
    [el, mark].forEach((n) => { n.addEventListener('pointerenter', on(true)); n.addEventListener('pointerleave', on(false)); });
    el.addEventListener('focus', on(true)); el.addEventListener('blur', on(false));
    li.append(leader(dx, dy), mark, el);
    return { p, li, el, at: inPicture(pl.x, pl.y, pl.top - 0.35), dx: dx + s * 12, dy, left: s < 0, size: null };
  }

  // ---- Camera ------------------------------------------------------------------------------------------------
  // `frame` says where the picture sits: its width, and which point of it goes where on the stage.
  // The picture always covers the stage, so its edges are never seen.
  const KB = 1.03; // the drift never scales below this, which leaves room for drift and parallax inside the cover
  const cover = (W, H, x, y) => {
    const { w, h } = ui.size;
    return [Math.min(0, Math.max(w - W, x)), Math.min(0, Math.max(h - H, y))];
  };
  function layout() {
    const { w, h } = ui.size;
    const f = frame(w, h);
    const W0 = Math.max(f.width ?? w, w, h * ASPECT);
    ui.base = { W: W0, H: W0 / ASPECT, f };
    plate.style.width = W0 + 'px'; plate.style.height = W0 / ASPECT + 'px';
    ui.compact = !!f.compact;
    stage.classList.toggle('is-compact', ui.compact);
    aim(true);
    checkDensity();
  }
  // Many projects: when labels would overlap (or there are simply many), show only the numbered markers and
  // reveal a label on hover, focus or selection.
  const DENSE_AT = 10;
  function checkDensity() {
    const b = ui.base; if (!b || ui.compact) { stage.classList.remove('is-dense'); return; }
    let dense = notes.length >= DENSE_AT;
    if (!dense) {
      stage.classList.remove('is-dense');
      const boxes = notes.map((n) => {
        const x = b.f.at[0] + (n.at[0] - b.f.point[0]) * b.W, y = b.f.at[1] + (n.at[1] - b.f.point[1]) * b.H;
        const lx = x + parseFloat(n.li.style.getPropertyValue('--lx')), ly = y + parseFloat(n.li.style.getPropertyValue('--ly'));
        const wd = n.el.offsetWidth + 8, ht = n.el.offsetHeight + 6, left = n.li.classList.contains('to-left') ? lx - wd : lx;
        return { l: left, r: left + wd, t: ly - ht / 2, b: ly + ht / 2 };
      });
      dense = boxes.some((a, i) => boxes.some((c, k) => k > i && a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b));
    }
    stage.classList.toggle('is-dense', dense);
    notes.forEach((n) => { n.size = null; });
  }
  const cam = { x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, px: 0, py: 0, tpx: 0, tpy: 0 };
  function aim(jump) {
    const b = ui.base; if (!b) return;
    const { f } = b;
    let s = 1, pt = f.point, at = f.at;
    if (ui.selected && plots[ui.selected.plot]) {
      const pl = plots[ui.selected.plot];
      const [gx, gy] = inPicture(pl.x, pl.y, 0.2), [, ty] = inPicture(pl.x, pl.y, pl.top);
      s = f.zoom ?? 1.4; pt = [gx, (gy + ty) / 2]; at = f.selAt ?? f.at;
    }
    const W = b.W * s, H = b.H * s;
    const [x, y] = cover(W, H, at[0] - pt[0] * W, at[1] - pt[1] * H);
    cam.tx = x; cam.ty = y; cam.ts = s;
    if (jump || !ui.motion) { cam.x = x; cam.y = y; cam.s = s; }
    wake();
  }

  let raf = 0, last = 0, t0 = performance.now();
  const running = () => ui.motion && ui.visible && !document.hidden;
  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    const k = ui.motion ? 1 - Math.exp(-dt / 0.42) : 1, kp = ui.motion ? 1 - Math.exp(-dt / 0.6) : 1;
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.s += (cam.ts - cam.s) * k;
    cam.px += (cam.tpx - cam.px) * kp; cam.py += (cam.tpy - cam.py) * kp;
    // Ken Burns: a slow breath of scale and a slower pan, about a minute per cycle.
    const t = ui.motion ? (now - t0) / 1000 : 0;
    const quiet = ui.selected ? 0.35 : 1;
    const kb = KB + (ui.motion ? 0.035 * quiet * (1 - Math.cos(t * 2 * Math.PI / 64)) / 2 : 0);
    const panX = ui.motion ? Math.sin(t * 2 * Math.PI / 90) * 7 * quiet : 0, panY = ui.motion ? Math.sin(t * 2 * Math.PI / 76) * 3 * quiet : 0;
    const { w, h } = ui.size, b = ui.base; if (!b) return;
    const X = w / 2 + (cam.x - w / 2) * kb + panX + cam.px * 9, Y = h / 2 + (cam.y - h / 2) * kb + panY + cam.py * 5, S = cam.s * kb;
    plate.style.transform = 'translate3d(' + X.toFixed(2) + 'px,' + Y.toFixed(2) + 'px,0) scale(' + S.toFixed(5) + ')';
    const put = (li, [fx, fy]) => { const x = X + S * fx * b.W, y = Y + S * fy * b.H; li.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; return [x, y]; };
    const blocks = occluders();
    const labelled = !ui.compact && !stage.classList.contains('is-dense');
    notes.forEach((n) => {
      const [x, y] = put(n.li, n.at);
      // Hide a callout (and take it out of the tab order) when its marker or label would sit under a panel or
      // off the photograph. The chosen project always stays.
      const boxes = [{ l: x - 14, r: x + 14, t: y - 14, b: y + 14 }];
      if (labelled) {
        if (!n.size) n.size = [n.el.offsetWidth, n.el.offsetHeight];
        const lx = x + n.dx, ly = y + n.dy, [bw, bh] = n.size;
        boxes.push(n.left ? { l: lx - bw, r: lx, t: ly - bh / 2, b: ly + bh / 2 } : { l: lx, r: lx + bw, t: ly - bh / 2, b: ly + bh / 2 });
      }
      const out = n.p !== ui.selected && boxes.some((bx) => bx.l < 4 || bx.r > w - 4 || bx.t < 4 || bx.b > h - 4
        || blocks.some((r) => bx.l < r.right && bx.r > r.left && bx.t < r.bottom && bx.b > r.top));
      n.li.classList.toggle('is-away', out);
    });
    put(hallLi, hallAt);
    { const [hx, hy] = hallAt; const x = X + S * hx * b.W, y = Y + S * hy * b.H; hallLi.classList.toggle('is-away', !!ui.selected || ui.compact || stage.classList.contains('is-dense') || blocks.some((r) => x - 170 < r.right && x > r.left && y - 50 < r.bottom && y > r.top)); }
    const settling = Math.abs(cam.tx - cam.x) + Math.abs(cam.ty - cam.y) + Math.abs(cam.ts - cam.s) * 500 + Math.abs(cam.tpx - cam.px) * 10 + Math.abs(cam.tpy - cam.py) * 10 > 0.2;
    if (settling || running()) raf = requestAnimationFrame(tick); else last = 0;
  }
  function wake() { if (!raf) raf = requestAnimationFrame(tick); }
  new ResizeObserver(([e]) => { ui.size = { w: e.contentRect.width, h: e.contentRect.height }; layout(); }).observe(stage);
  new IntersectionObserver(([e]) => { ui.visible = e.isIntersecting; wake(); }).observe(stage);
  document.addEventListener('visibilitychange', wake);
  stage.addEventListener('pointermove', (event) => {
    if (!ui.motion || event.pointerType === 'touch') return;
    const box = stage.getBoundingClientRect();
    cam.tpx = -((event.clientX - box.left) / box.width - 0.5) * 2; cam.tpy = -((event.clientY - box.top) / box.height - 0.5) * 2; wake();
  });
  stage.addEventListener('pointerleave', () => { cam.tpx = 0; cam.tpy = 0; wake(); });

  // ---- Light ---------------------------------------------------------------------------------------------------
  function setLight(name) {
    ui.light = name;
    const actual = name === 'auto' ? daylightNow() : name;
    stage.dataset.light = actual;
    return actual;
  }
  setLight('day'); // real renders for other times of day are not made yet, so the page opens in daylight
  build(projects);

  return {
    setProjects: (next) => { ui.selected = null; stage.classList.remove('has-selection'); build(next); aim(true); },
    get selected() { return ui.selected; },
    get light() { return ui.light; },
    tagFor: (p) => notes.find((n) => n.p === p)?.el ?? null,
    select(p) {
      ui.selected = p;
      notes.forEach((n) => { if (kind !== 'link') n.el.setAttribute('aria-pressed', String(n.p === p)); n.li.classList.toggle('is-chosen', n.p === p); });
      if (p && !plots[p.plot]) onStatus?.(p.title + ' has no building on the campus picture yet.');
      stage.classList.toggle('has-selection', !!p);
      aim(false);
    },
    setMotion(on) { ui.motion = on; if (!on) { cam.tpx = 0; cam.tpy = 0; cam.px = 0; cam.py = 0; } t0 = performance.now(); aim(true); },
    setLight,
    relayout: () => aim(true),
  };
}
