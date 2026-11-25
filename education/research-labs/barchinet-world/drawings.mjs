// Barchinet World prototype: the drawn plan and daylight section of the Courtyard studio.
// Both drawings are separate SVG files (assets/drawings). They are fetched once and placed inline so the page can
// wire their hotspots, switch the plan's daylight overlays and draw a what-if sun ray on the section.
// Neither needs WebGL.
const cache = {};
function load(name) {
  cache[name] ||= fetch(new URL(`./assets/drawings/courtyard-studio-${name}.svg`, import.meta.url)).then(r => { if (!r.ok) throw new Error(`Drawing request failed (${r.status})`); return r.text(); });
  cache[name].catch(() => { delete cache[name]; });
  return cache[name];
}
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, text) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text != null) n.textContent = text; return n; };

// Plan. Returns { setOverlay(name), highlight(anchor) }. onPick(anchor) is called from the numbered hotspots.
export async function mountPlan(host, { onPick = null } = {}) {
  let svg;
  try { host.innerHTML = await load('plan'); svg = host.querySelector('svg'); } catch { host.innerHTML = '<p class="bw-hint">The plan drawing could not be loaded.</p>'; return { setOverlay() {}, highlight() {} }; }
  svg.classList.add('bw-inline-drawing');
  const hots = [...svg.querySelectorAll('g.hot[data-anchor]')];
  if (onPick) {
    const hitR = Math.round(Math.max(34, Math.min(62, 22 * 1155 / Math.max(200, host.clientWidth))));   // about 44 px across on screen, capped so targets do not overlap
    svg.setAttribute('role', 'group');                         // the drawing contains buttons, so it cannot be a plain image
    for (const g of hots) {
      const pick = () => onPick(g.dataset.anchor);
      const c = g.querySelector('circle');                      // larger invisible target for fingers
      if (c) g.prepend(el('circle', { cx: c.getAttribute('cx'), cy: c.getAttribute('cy'), r: hitR, class: 'bw-hit' }));
      g.setAttribute('aria-pressed', 'false');
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    }
    for (const g of svg.querySelectorAll('[data-anchor]:not(.hot)')) g.addEventListener('click', () => onPick(g.dataset.anchor));
  } else for (const g of hots) { g.removeAttribute('tabindex'); g.removeAttribute('role'); }
  const layers = { winter: svg.querySelector('#layer-daylight-winter'), summer: svg.querySelector('#layer-daylight-summer') };
  return {
    setOverlay(name) { for (const [k, g] of Object.entries(layers)) if (g) g.style.display = k === name ? '' : 'none'; },
    highlight(anchor) { for (const g of hots) { const on = g.dataset.anchor === anchor; g.classList.toggle('is-active', on); if (onPick) g.setAttribute('aria-pressed', String(on)); const c = g.querySelector('circle:not(.bw-hit)'); if (c) c.setAttribute('r', on ? 16 : 13); } }
  };
}

// Section. Returns { whatIf(result) } which draws one extra noon ray for a canopy depth chosen by the visitor.
// Drawing scale: 60 px per metre, floor at y = 453, glass at x = 651, north to the right.
export async function mountSection(host) {
  let svg;
  try { host.innerHTML = await load('section'); svg = host.querySelector('svg'); } catch { host.innerHTML = '<p class="bw-hint">The section drawing could not be loaded.</p>'; return { whatIf() {} }; }
  svg.classList.add('bw-inline-drawing');
  const layer = el('g', { id: 'bw-whatif' }); svg.append(layer);
  const S = 60, FLOOR = 453, GLASS = 651, WALL_OUT = 642, WALL_IN = 660, HEAD = 285, UNDER = 273;
  return {
    whatIf(r, label) {
      layer.textContent = '';
      if (!r) return;
      const edgeX = r.byCanopy ? WALL_OUT - r.canopy * S : WALL_OUT, edgeY = r.byCanopy ? UNDER : HEAD;
      if (r.canopy > 0.04 && Math.abs(r.canopy - 1.6) > 0.04) layer.append(el('rect', { x: WALL_OUT - r.canopy * S, y: 264.6, width: r.canopy * S, height: 8.4, class: 'bw-wi-canopy' }));
      const t = Math.tan(r.profile * Math.PI / 180), ux = 1 / Math.hypot(1, t), uy = t / Math.hypot(1, t), len = 250;
      const endX = r.reach > 0.02 ? WALL_IN + r.reach * S : GLASS, endY = r.reach > 0.02 ? FLOOR : FLOOR - r.top * S;
      layer.append(el('path', { d: `M${(edgeX - len * ux).toFixed(1)} ${(edgeY - len * uy).toFixed(1)}L${edgeX.toFixed(1)} ${edgeY}L${endX.toFixed(1)} ${endY.toFixed(1)}`, class: 'bw-wi-ray' }));
      if (r.reach > 0.02) layer.append(el('rect', { x: WALL_IN, y: FLOOR - 9, width: (r.reach * S).toFixed(1), height: 9, class: 'bw-wi-patch' }));
      layer.append(el('rect', { x: 676, y: 290, width: 12 + label.length * 7.6, height: 26, rx: 6, class: 'bw-wi-tag' }));
      layer.append(el('text', { x: 684, y: 308, class: 'bw-wi-text', 'text-anchor': 'start' }, label));
    }
  };
}
