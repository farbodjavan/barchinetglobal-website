// Architectural plan drawing in SVG for Research Labs.
// Input is a small description in metres (x to the right, y downwards, north up unless `north` says otherwise).
// Output follows drawing conventions: heavy cut walls with poché, light lines for what is seen beyond,
// hatches for floor finishes, door swings, window lines, dimension strings with slashes, room labels with
// areas, a north arrow and a scale bar. Rooms can be made selectable so a plan can drive a 3D camera.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = v => Math.round(v * 1000) / 1000;
let serial = 0;

export function polygonArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) { const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length]; sum += x1 * y2 - x2 * y1; }
  return Math.abs(sum) / 2;
}

function wallPath(w) { // a wall is a thick line; returned as a closed quad so poché and outline share geometry
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = Math.hypot(dx, dy) || 1, t = (w.t ?? .2) / 2, nx = -dy / len * t, ny = dx / len * t;
  return `M${n(w.x1 + nx)} ${n(w.y1 + ny)}L${n(w.x2 + nx)} ${n(w.y2 + ny)}L${n(w.x2 - nx)} ${n(w.y2 - ny)}L${n(w.x1 - nx)} ${n(w.y1 - ny)}Z`;
}

function dimension(d, unit) {
  const [x1, y1] = d.from, [x2, y2] = d.to, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ox = -dy / len * d.offset, oy = dx / len * d.offset, ax = x1 + ox, ay = y1 + oy, bx = x2 + ox, by = y2 + oy;
  const tick = .16, ux = dx / len, uy = dy / len, sx = (ux - uy) * tick, sy = (uy + ux) * tick;
  const text = d.text ?? `${(Math.round(len * 100) / 100).toLocaleString('en-US')} ${unit}`;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI, flip = angle > 89.9 || angle < -90.1 ? 180 : 0, side = Math.sign(d.offset) || 1;
  const tx = (ax + bx) / 2 - dy / len * .28 * side * (flip ? -1 : 1) * 0 + (-dy / len) * .3 * side, ty = (ay + by) / 2 + (dx / len) * .3 * side;
  return `<g class="pk-dim"><path d="M${n(x1 + ox * .25)} ${n(y1 + oy * .25)}L${n(ax + ox * .12)} ${n(ay + oy * .12)}M${n(x2 + ox * .25)} ${n(y2 + oy * .25)}L${n(bx + ox * .12)} ${n(by + oy * .12)}M${n(ax)} ${n(ay)}L${n(bx)} ${n(by)}"/><path class="pk-tick" d="M${n(ax - sx)} ${n(ay - sy)}L${n(ax + sx)} ${n(ay + sy)}M${n(bx - sx)} ${n(by - sy)}L${n(bx + sx)} ${n(by + sy)}"/><text x="${n(tx)}" y="${n(ty)}" transform="rotate(${n(angle + flip)} ${n(tx)} ${n(ty)})" text-anchor="middle" dominant-baseline="middle">${esc(text)}</text></g>`;
}

function door(d) { // hinge at (x, y); leaf of width w; `along` is the wall direction in degrees; swing 1 or -1
  const a = (d.along ?? 0) * Math.PI / 180, s = d.swing ?? 1, w = d.w ?? .9;
  const ex = d.x + Math.cos(a) * w, ey = d.y + Math.sin(a) * w; // closed position (in the wall)
  const lx = d.x + Math.cos(a + s * Math.PI / 2) * w, ly = d.y + Math.sin(a + s * Math.PI / 2) * w; // open leaf
  return `<g class="pk-door"><path class="pk-gap" d="M${n(d.x)} ${n(d.y)}L${n(ex)} ${n(ey)}"/><path d="M${n(d.x)} ${n(d.y)}L${n(lx)} ${n(ly)}"/><path class="pk-swing" d="M${n(lx)} ${n(ly)}A${n(w)} ${n(w)} 0 0 ${s > 0 ? 0 : 1} ${n(ex)} ${n(ey)}"/></g>`;
}

function windowLines(w) {
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = Math.hypot(dx, dy) || 1, t = (w.t ?? .2) / 2, nx = -dy / len * t, ny = dx / len * t;
  const line = k => `M${n(w.x1 + nx * k)} ${n(w.y1 + ny * k)}L${n(w.x2 + nx * k)} ${n(w.y2 + ny * k)}`;
  return `<g class="pk-window"><path class="pk-gap" d="${line(0)}" style="stroke-width:${n(t * 2 + .02)}"/><path d="${line(1)}${line(-1)}${line(0)}M${n(w.x1 + nx)} ${n(w.y1 + ny)}L${n(w.x1 - nx)} ${n(w.y1 - ny)}M${n(w.x2 + nx)} ${n(w.y2 + ny)}L${n(w.x2 - nx)} ${n(w.y2 - ny)}"/></g>`;
}

const furnitureShapes = {
  rect: f => `<rect x="${n(f.x)}" y="${n(f.y)}" width="${n(f.w)}" height="${n(f.h)}" rx="${n(f.r ?? .03)}"${f.rot ? ` transform="rotate(${f.rot} ${n(f.x + f.w / 2)} ${n(f.y + f.h / 2)})"` : ''}/>`,
  circle: f => `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}"/>`,
  tree: f => `<g class="pk-tree"><circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}"/><circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r * .62)}"/><circle cx="${n(f.x)}" cy="${n(f.y)}" r=".06"/>${[0, 1, 2, 3, 4, 5, 6].map(i => { const a = i * 0.9; return `<path d="M${n(f.x)} ${n(f.y)}L${n(f.x + Math.cos(a) * f.r)} ${n(f.y + Math.sin(a) * f.r)}"/>`; }).join('')}</g>`,
  line: f => `<path d="M${f.points.map(p => `${n(p[0])} ${n(p[1])}`).join('L')}"/>`,
  dashed: f => `<path class="pk-above" d="M${f.points.map(p => `${n(p[0])} ${n(p[1])}`).join('L')}${f.closed ? 'Z' : ''}"/>`,
  steps: f => Array.from({ length: f.count }, (_, i) => `<path d="M${n(f.x)} ${n(f.y + i * f.going)}h${n(f.w)}"/>`).join('') + `<path class="pk-arrow" d="M${n(f.x + f.w / 2)} ${n(f.y + f.count * f.going)}V${n(f.y + .05)}m-.12 .2 .12 -.2 .12 .2"/>`,
};

export function drawPlan(plan, { selected, selectable = false, labelledBy } = {}) {
  const id = `pk${++serial}`, unit = plan.unit || 'm', pad = plan.pad ?? 2.4;
  const [minX, minY, maxX, maxY] = plan.bounds, vbX = minX - pad, vbY = minY - pad, vbW = maxX - minX + pad * 2, vbH = maxY - minY + pad * 2 + 1.1;
  const north = plan.north ?? 0, barUnits = plan.scaleBar ?? [0, 1, 2, 5], barX = vbX + .5, barY = vbY + vbH - .75;
  const rooms = (plan.rooms || []).map((room, index) => {
    const area = room.area ?? polygonArea(room.poly), d = `M${room.poly.map(p => `${n(p[0])} ${n(p[1])}`).join('L')}Z`, on = selected === room.id;
    const [lx, ly] = room.label ?? room.poly.reduce((a, p) => [a[0] + p[0] / room.poly.length, a[1] + p[1] / room.poly.length], [0, 0]);
    const interactive = selectable && room.selectable !== false;
    return `<g class="pk-room${on ? ' pk-on' : ''}${interactive ? ' pk-pick' : ''}" data-room="${esc(room.id)}"${interactive ? ` tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(room.name)}, ${area.toFixed(1)} square metres. Show in 3D."` : ''}><path class="pk-fill" d="${d}" fill-rule="evenodd"${room.hatch ? ` style="fill:url(#${id}-${room.hatch})"` : ''}/><path class="pk-wash" d="${d}" fill-rule="evenodd"/><text class="pk-name" x="${n(lx)}" y="${n(ly)}" text-anchor="middle">${esc(room.name.toUpperCase())}</text>${room.showArea === false ? '' : `<text class="pk-area" x="${n(lx)}" y="${n(ly + .42)}" text-anchor="middle">${area.toFixed(1)} m²</text>`}${room.number ? `<g class="pk-tag"><circle cx="${n(lx)}" cy="${n(ly - .62)}" r=".3"/><text x="${n(lx)}" y="${n(ly - .62)}" text-anchor="middle" dominant-baseline="central">${esc(room.number)}</text></g>` : ''}</g>`;
  }).join('');
  const walls = (plan.walls || []).map(wallPath).join('');
  return `<svg class="pk-plan" viewBox="${n(vbX)} ${n(vbY)} ${n(vbW)} ${n(vbH)}" xmlns="http://www.w3.org/2000/svg" ${labelledBy ? `aria-labelledby="${labelledBy}"` : `role="group" aria-label="${esc(plan.title || 'Floor plan')}"`} preserveAspectRatio="xMidYMid meet">
<defs>
<pattern id="${id}-poche" width=".14" height=".14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width=".14" height=".14" class="pk-poche-bg"/><path d="M0 0V.14" class="pk-poche-line"/></pattern>
<pattern id="${id}-timber" width="1.2" height=".16" patternUnits="userSpaceOnUse"><rect width="1.2" height=".16" class="pk-paper"/><path d="M0 .16H1.2M.5 0V.16" class="pk-hatch"/></pattern>
<pattern id="${id}-tile" width=".6" height=".6" patternUnits="userSpaceOnUse"><rect width=".6" height=".6" class="pk-paper"/><path d="M0 0H.6V.6" class="pk-hatch"/></pattern>
<pattern id="${id}-paving" width=".9" height=".45" patternUnits="userSpaceOnUse"><rect width=".9" height=".45" class="pk-paper"/><path d="M0 0H.9M0 .45H.9M0 0V.45M.45 .45V.9" class="pk-hatch"/></pattern>
<pattern id="${id}-gravel" width=".5" height=".5" patternUnits="userSpaceOnUse"><rect width=".5" height=".5" class="pk-paper"/><circle cx=".1" cy=".12" r=".025" class="pk-dot"/><circle cx=".36" cy=".3" r=".02" class="pk-dot"/><circle cx=".2" cy=".42" r=".018" class="pk-dot"/></pattern>
<pattern id="${id}-planting" width=".7" height=".7" patternUnits="userSpaceOnUse"><rect width=".7" height=".7" class="pk-paper"/><path d="M.1 .2q.1-.14.2 0M.42 .5q.1-.14.2 0M.5 .16q.06-.1.12 0" class="pk-hatch"/></pattern>
<pattern id="${id}-concrete" width=".8" height=".8" patternUnits="userSpaceOnUse"><rect width=".8" height=".8" class="pk-paper"/><path d="M.1 .15l.05 .08M.5 .1l.07 .03M.3 .5l.04 .09M.62 .6l.06 .02" class="pk-hatch"/><circle cx=".2" cy=".65" r=".012" class="pk-dot"/><circle cx=".7" cy=".3" r=".012" class="pk-dot"/></pattern>
</defs>
<rect class="pk-paper" x="${n(vbX)}" y="${n(vbY)}" width="${n(vbW)}" height="${n(vbH)}"/>
${plan.site ? `<path class="pk-site" d="M${plan.site.map(p => `${n(p[0])} ${n(p[1])}`).join('L')}Z"/>` : ''}
${(plan.grid || []).map(g => g.x !== undefined ? `<g class="pk-grid"><path d="M${n(g.x)} ${n(minY - 1.5)}V${n(maxY + .5)}"/><circle cx="${n(g.x)}" cy="${n(minY - 1.8)}" r=".3"/><text x="${n(g.x)}" y="${n(minY - 1.8)}" text-anchor="middle" dominant-baseline="central">${esc(g.label)}</text></g>` : `<g class="pk-grid"><path d="M${n(minX - 1.5)} ${n(g.y)}H${n(maxX + .5)}"/><circle cx="${n(minX - 1.8)}" cy="${n(g.y)}" r=".3"/><text x="${n(minX - 1.8)}" y="${n(g.y)}" text-anchor="middle" dominant-baseline="central">${esc(g.label)}</text></g>`).join('')}
<g class="pk-rooms">${rooms}</g>
<g class="pk-furniture">${(plan.furniture || []).map(f => furnitureShapes[f.type](f)).join('')}</g>
<path class="pk-walls" d="${walls}" style="fill:url(#${id}-poche)"/>
${(plan.columns || []).map(c => `<rect class="pk-column" x="${n(c[0] - (c[2] ?? .2) / 2)}" y="${n(c[1] - (c[2] ?? .2) / 2)}" width="${n(c[2] ?? .2)}" height="${n(c[2] ?? .2)}"/>`).join('')}
${(plan.windows || []).map(windowLines).join('')}${(plan.doors || []).map(door).join('')}
${(plan.dims || []).map(d => dimension(d, unit)).join('')}
${(plan.notes || []).map(note => `<text class="pk-note ${esc(note.cls || '')}" x="${n(note.x)}" y="${n(note.y)}" text-anchor="${note.anchor || 'middle'}">${esc(note.text)}</text>`).join('')}
${plan.sectionMark ? `<g class="pk-section"><path d="M${n(plan.sectionMark.x1)} ${n(plan.sectionMark.y)}H${n(plan.sectionMark.x2)}"/><circle cx="${n(plan.sectionMark.x1)}" cy="${n(plan.sectionMark.y)}" r=".34"/><circle cx="${n(plan.sectionMark.x2)}" cy="${n(plan.sectionMark.y)}" r=".34"/><text x="${n(plan.sectionMark.x1)}" y="${n(plan.sectionMark.y)}" text-anchor="middle" dominant-baseline="central">${esc(plan.sectionMark.label)}</text><text x="${n(plan.sectionMark.x2)}" y="${n(plan.sectionMark.y)}" text-anchor="middle" dominant-baseline="central">${esc(plan.sectionMark.label)}</text></g>` : ''}
<g class="pk-north" transform="translate(${n(vbX + vbW - 1.1)} ${n(vbY + 1.15)}) rotate(${n(north)})"><circle r=".62"/><path class="pk-north-solid" d="M0 -.62L.2 .16L0 .02Z"/><path d="M0 -.62L-.2 .16L0 .02Z"/><text y="-.78" text-anchor="middle">N</text></g>
<g class="pk-scale" transform="translate(${n(barX)} ${n(barY)})">${barUnits.slice(1).map((v, i) => `<rect x="${n(barUnits[i])}" y="0" width="${n(v - barUnits[i])}" height=".14" class="${i % 2 ? 'pk-bar-b' : 'pk-bar-a'}"/>`).join('')}${barUnits.map(v => `<text x="${n(v)}" y="-.14" text-anchor="middle">${v}</text>`).join('')}<text x="${n(barUnits.at(-1) + .3)}" y=".14">${unit}</text></g>
${plan.title ? `<text class="pk-title" x="${n(vbX + vbW - .5)}" y="${n(barY + .14)}" text-anchor="end">${esc(plan.title)}</text>` : ''}
</svg>`;
}

// Keyboard and pointer selection for plans drawn with { selectable: true }.
export function bindPlan(container, onSelect) {
  const pick = event => { const room = event.target.closest?.('.pk-pick'); if (room && container.contains(room)) onSelect(room.dataset.room, room); };
  container.addEventListener('click', pick);
  container.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { const room = event.target.closest?.('.pk-pick'); if (room) { event.preventDefault(); onSelect(room.dataset.room, room); } } });
}
