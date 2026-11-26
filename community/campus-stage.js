// The campus photograph as the page opening. One rendered photograph, treated like a plate in a publication:
// always shown whole (fitted, never cropped), a very slow drift and a soft parallax on the pointer that use only
// the spare room beside the fitted picture, an eased move toward a chosen building (closing returns to the whole picture), and
// drawing callouts (numbered marker, thin leader, compact label) that are real buttons or links.
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
  // The hall's label leaves its dot down and to the right, over the open square, clear of the project markers.
  const HALL = [44, 40];
  const hallLi = make('li', 'note-item hall'); hallLi.setAttribute('aria-hidden', 'true');
  hallLi.style.setProperty('--lx', HALL[0] + 12 + 'px'); hallLi.style.setProperty('--ly', HALL[1] + 'px');
  hallLi.append(leader(HALL[0], HALL[1]), make('span', 'mark dot'), make('span', 'note hall-note', 'Barchinet hall'));
  const hallAt = inPicture(hall.x, hall.y, hall.top - 0.6);
  function build(list_) {
    notes.forEach((n) => n.li.remove());
    notes = list_.filter((p) => plots[p.plot]).map(note);
    list.replaceChildren(...notes.map((n) => n.li), hallLi);
    if (ui.base) { spread(); checkDensity(); }
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
    // In the markers-only view, a name shown on hover or focus opens toward the middle of the picture.
    const at = inPicture(pl.x, pl.y, pl.top - 0.35);
    li.classList.toggle('tip-left', at[0] > 0.5);
    return { p, li, el, at, dx: dx + s * 12, dy, lead: [dx, dy], left: s < 0, size: null };
  }

  // ---- Camera ------------------------------------------------------------------------------------------------
  // `frame` gives the zoom toward a chosen building, where that building goes on the stage, and whether the stage is
  // small enough for markers only. The picture itself is always fitted whole into the stage and centred: full width
  // where the height allows, otherwise as tall as the stage. Only a chosen building zooms in (and crops) until closed.
  // A position along one axis: inside the stage when the picture is smaller, covering it when larger.
  const place = (len, size, v) => (size <= len ? Math.min(len - size, Math.max(0, v)) : Math.min(0, Math.max(len - size, v)));
  function layout() {
    const { w, h } = ui.size;
    const f = frame(w, h);
    const W0 = Math.min(w, h * ASPECT);
    ui.base = { W: W0, H: W0 / ASPECT, f };
    plate.style.width = W0 + 'px'; plate.style.height = W0 / ASPECT + 'px';
    stage.parentElement?.style.setProperty('--stage-h', h + 'px');
    ui.compact = !!f.compact;
    stage.classList.toggle('is-compact', ui.compact);
    spread();
    aim(true);
    checkDensity();
  }
  // Markers only (small screens): every marker is a target of at least 44 px. Where two buildings stand closer than
  // that on the picture, their markers are moved apart by the few pixels needed, so no target covers another.
  const GAP = 48;
  function spread() {
    const b = ui.base;
    notes.forEach((n) => { n.nudge = [0, 0]; });
    if (!b || !ui.compact) return;
    const pts = notes.map((n) => [n.at[0] * b.W, n.at[1] * b.H]);
    for (let round = 0; round < 30; round += 1) {
      let moved = false;
      for (let i = 0; i < notes.length; i += 1) for (let k = i + 1; k < notes.length; k += 1) {
        const a = pts[i], c = pts[k], dx = c[0] - a[0], dy = c[1] - a[1];
        const px = GAP - Math.abs(dx), py = GAP - Math.abs(dy);
        if (px <= 0 || py <= 0) continue;
        moved = true;
        // Push apart along the axis that needs the smaller move.
        if (px <= py) { const m = (px / 2 + 0.1) * (Math.sign(dx) || 1); a[0] -= m; c[0] += m; } else { const m = (py / 2 + 0.1) * (Math.sign(dy) || 1); a[1] -= m; c[1] += m; }
      }
      if (!moved) break;
    }
    notes.forEach((n, i) => { n.nudge = [pts[i][0] - n.at[0] * b.W, pts[i][1] - n.at[1] * b.H]; });
  }
  // Labels are shown only when every one of them fits: inside the picture's frame with room for the drift, clear of
  // each other, of the other markers, of the leaders and of the hall's label. Otherwise (or with many projects) only
  // the numbered markers are shown and a label appears on hover, focus or selection.
  const DENSE_AT = 10;
  const ROOM = 10; // labels keep this much clear of the picture's edge
  function checkDensity() {
    const b = ui.base; if (!b || ui.compact) { stage.classList.remove('is-dense'); return; }
    let dense = notes.length >= DENSE_AT;
    if (!dense && notes.length) {
      stage.classList.remove('is-dense');
      const { w, h } = ui.size, X = (w - b.W) / 2, Y = (h - b.H) / 2;
      const spot = ([fx, fy]) => [X + fx * b.W, Y + fy * b.H];
      const label = ([x, y], dx, dy, el, left) => {
        const wd = el.offsetWidth + 6, ht = el.offsetHeight + 6, lx = x + dx, ly = y + dy, l = left ? lx - wd : lx;
        return { l, r: l + wd, t: ly - ht / 2, b: ly + ht / 2 };
      };
      const labels = notes.map((n) => label(spot(n.at), n.dx, n.dy, n.el, n.left));
      const hallBox = label(spot(hallAt), HALL[0] + 12, HALL[1], hallLi.querySelector('.hall-note'), false);
      const marks = notes.map((n) => { const [x, y] = spot(n.at); return { l: x - 15, r: x + 15, t: y - 15, b: y + 15 }; });
      const hit = (a, c) => a.l < c.r && c.l < a.r && a.t < c.b && c.t < a.b;
      // Points along each leader, from the marker to the label.
      const leads = notes.map((n) => { const [x, y] = spot(n.at); return [0.35, 0.55, 0.75, 0.95].map((k) => ({ l: x + n.lead[0] * k - 1, r: x + n.lead[0] * k + 1, t: y + n.lead[1] * k - 1, b: y + n.lead[1] * k + 1 })); });
      const inside = (a) => a.l >= X + ROOM && a.r <= X + b.W - ROOM && a.t >= Y + ROOM && a.b <= Y + b.H - ROOM;
      dense = [...labels, hallBox].some((a) => !inside(a))
        || labels.some((a, i) => labels.some((c, k) => k > i && hit(a, c)) || hit(a, hallBox)
          || marks.some((m, k) => k !== i && hit(a, m)) || leads.some((pts, k) => k !== i && pts.some((pt) => hit(a, pt))));
    }
    stage.classList.toggle('is-dense', dense);
    notes.forEach((n) => { n.size = null; });
  }
  const cam = { x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1, px: 0, py: 0, tpx: 0, tpy: 0 };
  function aim(jump) {
    const b = ui.base; if (!b) return;
    const { f } = b;
    let s = 1, pt = [0.5, 0.5], at = [ui.size.w / 2, ui.size.h / 2];
    if (ui.selected && plots[ui.selected.plot]) {
      const pl = plots[ui.selected.plot];
      const [gx, gy] = inPicture(pl.x, pl.y, 0.2), [, ty] = inPicture(pl.x, pl.y, pl.top);
      s = f.zoom ?? 1.4; pt = [gx, (gy + ty) / 2]; at = f.selAt ?? at;
    }
    const W = b.W * s, H = b.H * s, { w, h } = ui.size;
    const x = ui.selected ? place(w, W, at[0] - pt[0] * W) : (w - W) / 2, y = ui.selected ? place(h, H, at[1] - pt[1] * H) : (h - H) / 2;
    cam.tx = x; cam.ty = y; cam.ts = s;
    if (jump || !ui.motion) { cam.x = x; cam.y = y; cam.s = s; }
    wake();
  }

  let raf = 0, last = 0, t0 = performance.now();
  const running = () => ui.motion && ui.visible && !document.hidden;
  function tick(now) {
    raf = 0;
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    const k = ui.motion ? 1 - Math.exp(-dt / 0.42) : 1, kp = ui.motion ? 1 - Math.exp(-dt / 0.6) : 1;
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; cam.s += (cam.ts - cam.s) * k;
    cam.px += (cam.tpx - cam.px) * kp; cam.py += (cam.tpy - cam.py) * kp;
    // A slow drift, about a minute and a half per cycle, and the pointer parallax. The picture keeps its fitted size;
    // they move it only within the spare room beside it (where the stage is wider or taller than the picture, at most
    // 9 px across and 6 px up and down), so the whole campus always stays in view. Without spare room it stays still.
    const t = ui.motion ? (now - t0) / 1000 : 0;
    const quiet = ui.selected ? 0.35 : 1;
    const { w, h } = ui.size, b = ui.base; if (!b) return;
    const S = cam.s;
    const roomX = Math.min(9, Math.max(0, w - S * b.W) / 2), roomY = Math.min(6, Math.max(0, h - S * b.H) / 2);
    const driftX = ui.motion ? 0.6 * Math.sin(t * 2 * Math.PI / 90) * quiet + 0.4 * cam.px : 0, driftY = ui.motion ? 0.6 * Math.sin(t * 2 * Math.PI / 76) * quiet + 0.4 * cam.py : 0;
    const X = place(w, S * b.W, cam.x + driftX * roomX), Y = place(h, S * b.H, cam.y + driftY * roomY);
    plate.style.transform = 'translate3d(' + X.toFixed(2) + 'px,' + Y.toFixed(2) + 'px,0) scale(' + S.toFixed(5) + ')';
    const put = (li, [fx, fy], [nx, ny] = [0, 0]) => { const x = X + S * fx * b.W + nx, y = Y + S * fy * b.H + ny; li.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; return [x, y]; };
    const blocks = occluders();
    const labelled = !ui.compact && !stage.classList.contains('is-dense');
    notes.forEach((n) => {
      const [x, y] = put(n.li, n.at, n.nudge);
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
    { const [hx, hy] = hallAt; const x = X + S * hx * b.W, y = Y + S * hy * b.H; hallLi.classList.toggle('is-away', !!ui.selected || ui.compact || stage.classList.contains('is-dense') || blocks.some((r) => x < r.right && x + 190 > r.left && y < r.bottom && y + 60 > r.top)); }
    const settling = Math.abs(cam.tx - cam.x) + Math.abs(cam.ty - cam.y) + Math.abs(cam.ts - cam.s) * 500 + Math.abs(cam.tpx - cam.px) * 10 + Math.abs(cam.tpy - cam.py) * 10 > 0.2;
    if (settling || running()) raf = requestAnimationFrame(tick); else last = 0;
  }
  function wake() { if (!raf) raf = requestAnimationFrame(tick); }
  new ResizeObserver(([e]) => { ui.size = { w: e.contentRect.width, h: e.contentRect.height }; layout(); }).observe(stage);
  document.fonts?.ready.then(() => { if (ui.base) checkDensity(); });
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
