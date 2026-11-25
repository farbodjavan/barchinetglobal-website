// Barchinet World prototype: simplified direct-sun model for the courtyard bay of the Los Angeles office.
// Dimensions are read off the Blender model (courtyard-studio-los-angeles.glb): a south-facing bay 6.0 m wide,
// glass head 2.8 m above the floor, set 0.15 m inside a 0.3 m wall, with a flat canopy 3.0 m above the floor.
// Direct sun on a clear day only. No sky light, reflections, fins, trees, neighbours or weather.
// This is a teaching model for a prototype, not a compliance or design calculation.

export const SITE = { name: 'Los Angeles', latitude: 34.05 };
// Plan coordinates in metres: x from west to east, z from north to south. Heights are above the floor.
export const ROOM = { x0: -6.7, x1: 6.7, z0: -4.2, z1: 4.2, depth: 8.4, head: 2.8, canopyUnder: 3.0, glassInset: 0.15, bayCentre: 1.2, canopyAsModelled: 1.6 };
export const OPENINGS = { wide: { label: 'Courtyard bay', width: 6.0 } };
// Noon sun altitudes as drawn on the studio's daylight section (whole degrees), so the numbers here match the drawing.
export const NOON_ALTITUDE = { summer: 79, equinox: 56, winter: 32 };
export const SEASONS = {
  summer: { label: 'June 21', long: 'Summer solstice', declination: 23.44 },
  equinox: { label: 'March 21 / September 21', long: 'Equinox', declination: 0 },
  winter: { label: 'December 21', long: 'Winter solstice', declination: -23.44 }
};
export const TARGETS = {
  summer: { max: 0.3, text: 'Summer noon: direct sun reaches no more than 0.3 m into the room.' },
  equinox: { max: 1.0, text: 'Equinox noon: direct sun reaches no more than 1.0 m.' },
  winter: { min: 2.5, text: 'Winter noon: direct sun reaches at least 2.5 m.' }
};
// Furniture footprints used for the low-sun note, read off the model.
export const FURNITURE = {
  table: { label: 'review table', x0: -0.6, x1: 3.0, z0: 0.83, z1: 2.17 },
  sofa: { label: 'sofa', x0: -5.6, x1: -3.6, z0: 2.78, z1: 3.72 }
};

const RAD = Math.PI / 180;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Solar position for a latitude, declination and solar time (hours). Azimuth is measured from south, positive to the west.
export function sunPosition(season, hour, latitude = SITE.latitude) {
  const lat = latitude * RAD, dec = SEASONS[season].declination * RAD, h = (hour - 12) * 15 * RAD;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h);
  const altitude = Math.asin(clamp(sinAlt, -1, 1));
  const azimuth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  const shown = hour === 12 && latitude === SITE.latitude ? NOON_ALTITUDE[season] : altitude / RAD;
  return { altitude: shown, azimuth: azimuth / RAD, up: altitude > 0.5 * RAD };
}

// Unit vector from the scene towards the sun. East is +x, up is +y, south is +z.
export function sunVector(season, hour) {
  const s = sunPosition(season, hour), a = s.altitude * RAD, g = s.azimuth * RAD;
  return { x: -Math.sin(g) * Math.cos(a), y: Math.sin(a), z: Math.cos(g) * Math.cos(a), ...s };
}

function clipPolygon(poly, x0, x1, z0, z1) {
  const edges = [[p => p[0] >= x0, (a, b) => cut(a, b, 0, x0)], [p => p[0] <= x1, (a, b) => cut(a, b, 0, x1)],
    [p => p[1] >= z0, (a, b) => cut(a, b, 1, z0)], [p => p[1] <= z1, (a, b) => cut(a, b, 1, z1)]];
  function cut(a, b, axis, v) { const t = (v - a[axis]) / (b[axis] - a[axis]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  let out = poly;
  for (const [inside, hit] of edges) {
    const src = out; out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i], b = src[(i + 1) % src.length], ia = inside(a), ib = inside(b);
      if (ia && ib) out.push(b); else if (ia && !ib) out.push(hit(a, b)); else if (!ia && ib) { out.push(hit(a, b)); out.push(b); }
    }
    if (!out.length) break;
  }
  return out;
}
const area = poly => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

// The instant check. canopy = depth in metres measured from the outside wall face; opening = 'narrow' | 'wide'.
export function check({ canopy, opening = 'wide', season, hour }) {
  const sun = sunPosition(season, hour), width = OPENINGS[opening].width, H = ROOM.head, inset = ROOM.glassInset;
  const gamma = sun.azimuth * RAD, facing = sun.up && Math.abs(sun.azimuth) < 89.5;
  const base = { sun, facing, width, canopy, opening, season, hour, shadedShare: 1, shadow: H, top: 0, reach: 0, patch: [], patchArea: 0, profile: null, lit: [], byCanopy: false };
  if (!facing) return base;
  const tanP = Math.tan(sun.altitude * RAD) / Math.cos(gamma);
  const profile = Math.atan(tanP) / RAD;
  // Highest sunlit point on the glass: limited by the wall head (lintel) and, if there is one, by the canopy edge.
  const lintel = H - inset * tanP, edge = canopy > 0.04 ? ROOM.canopyUnder - (canopy + inset) * tanP : Infinity;
  const top = clamp(Math.min(lintel, edge), 0, H);
  const reach = Math.max(0, top / tanP - inset);       // measured from the inside face of the wall
  const shift = Math.tan(gamma);                       // metres east per metre of depth into the room
  let patch = [];
  if (reach > 0.01) {
    const zs = ROOM.z1, zn = zs - reach, dx = reach * shift, a = ROOM.bayCentre - width / 2, b = ROOM.bayCentre + width / 2;
    patch = clipPolygon([[a, zs], [b, zs], [b + dx, zn], [a + dx, zn]], ROOM.x0, ROOM.x1, ROOM.z0, ROOM.z1);
  }
  const lit = Object.entries(FURNITURE).filter(([, f]) => patch.length > 2 && area(clipPolygon(patch, f.x0, f.x1, f.z0, f.z1)) > 0.05).map(([k]) => k);
  return { ...base, profile, top, shadow: H - top, shadedShare: (H - top) / H, byCanopy: edge < lintel, reach: Math.min(reach, ROOM.depth), rawReach: reach, patch, patchArea: patch.length > 2 ? area(patch) : 0, lit };
}

// Noon review against the three prototype targets.
export function noonReview(canopy, opening = 'wide') {
  return Object.keys(SEASONS).map(season => {
    const r = check({ canopy, opening, season, hour: 12 }), t = TARGETS[season];
    const pass = t.max != null ? r.reach <= t.max + 1e-9 : r.reach >= t.min - 1e-9;
    return { season, reach: r.reach, altitude: r.sun.altitude, shadedShare: r.shadedShare, pass, target: t };
  });
}

// Hours on the winter solstice when direct sun lands on furniture. This is what prompts the specialist question.
export function lowSunNote(canopy, opening = 'wide') {
  const found = {};
  for (let hour = 8; hour <= 16.01; hour += 0.5) {
    for (const key of check({ canopy, opening, season: 'winter', hour }).lit) {
      const ranges = (found[key] ||= []), last = ranges[ranges.length - 1];
      if (last && hour - last[1] < 0.51) last[1] = hour; else ranges.push([hour, hour]);
    }
  }
  return Object.entries(found).map(([key, ranges]) => ({ key, label: FURNITURE[key].label, ranges }));
}

// Canopy depths (0.1 m steps) that meet all three noon targets for an opening.
export function passingDepths(opening = 'wide') {
  const ok = [];
  for (let d = 0; d <= 2.401; d += 0.1) if (noonReview(Number(d.toFixed(1)), opening).every(r => r.pass)) ok.push(Number(d.toFixed(1)));
  return ok.length ? [ok[0], ok[ok.length - 1]] : null;
}

export const formatHour = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
export const formatMetres = m => `${m.toFixed(1)} m`;
export const formatPercent = s => `${Math.round(s * 100)}%`;

export function summary(r) {
  if (!r.sun.up) return `At ${formatHour(r.hour)} solar time on ${SEASONS[r.season].label} the sun is below the horizon in ${SITE.name}.`;
  if (!r.facing) return `At ${formatHour(r.hour)} the sun is behind the south-facing opening, so no direct sun enters.`;
  const where = r.reach < 0.05 ? 'No direct sun reaches the floor.' : `Direct sun reaches ${formatMetres(r.reach)} into the room and lights about ${r.patchArea.toFixed(1)} m² of floor.`;
  const what = r.canopy > 0.04 ? `The ${r.canopy.toFixed(1)} m canopy and the wall head shade` : 'With no canopy, the wall head shades';
  return `Sun altitude ${Math.round(r.sun.altitude)}°. ${what} ${formatPercent(r.shadedShare)} of the glass. ${where}`;
}
