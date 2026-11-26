// Where things are on the campus, in the units of the Blender scene (dev/blender/build_campus.py in the workspace
// source): x to the right-back, y to the left-back, z up. Only positions are kept here; the photograph is the picture.
//
// The hero picture is ONE swappable asset, in two sizes of the same image: replace img/campus-hero.jpg (2400 px)
// and img/campus-hero-1200.jpg (1200 px) and every view (the opening, the key plan, the crops, the home page section)
// follows. If a new picture moves the buildings, update the plot positions below; the markers are drawn from them.
export const heroImage = { src: '/community/img/campus-hero.jpg', small: '/community/img/campus-hero-1200.jpg', width: 2400, height: 1500 };

// The eight plots, their roof heights, how the callout leaves the marker (`lead`, in px; optional) and a short
// description of the building on the picture, used in the alternative text. A project's `plot` (from the public API)
// is the index in this list; projects without a plot have no building on the picture yet.
export const plots = [
  { x: -5, y: 5, top: 3.6, lead: [44, -10], building: 'a white building that steps back in terraces' },
  { x: 0, y: 5.4, top: 1.8, lead: [40, -46], building: 'an L-shaped brick block around a yard' },
  { x: 5, y: 5, top: 3.4, building: 'a pair of dark towers with balconies' },
  { x: -5.4, y: 0, top: 1.6, lead: [-34, -46], building: 'a cluster of small pitched-roof houses' },
  { x: 5.4, y: 0, top: 2.7, lead: [46, 30], building: 'a glass dome on a round base' },
  { x: -5, y: -5, top: 2.2, lead: [-36, -50], building: 'a pale block with tall fins' },
  { x: 0, y: -5.4, top: 2.9, building: 'a round tower with bronze bands' },
  { x: 5, y: -5, top: 1.6, lead: [-44, 34], building: 'a low building with a planted roof' },
];
export const hall = { x: 0, y: 0, top: 3.0 };

// Where a point of the scene lands in the rendered picture, as a share of its width and height.
// (Isometric camera, 27.5 units wide on a 16:10 frame.)
const COS = 0.8165, SIN = 0.5774, R2 = Math.SQRT1_2;
export function inPicture(x, y, z) {
  const right = (x + y) * R2;
  const up = z * COS + (y - x) * R2 * SIN;
  return [0.5 + right / 27.5, 0.564 - up / 17.1875];
}

// A crop of the photograph around one building, as shares of the picture: left, top, width, height.
// The crops are cut by the browser from the one hero file, so replacing that file updates every crop.
export function cropFor(plot, { w = 0.2, aspect = 4 / 3 } = {}) {
  const p = plot === 'hall' || !plots[plot] ? hall : plots[plot];
  const [gx, gy] = inPicture(p.x, p.y, 0.2), [, ty] = inPicture(p.x, p.y, p.top);
  const h = w * 1.6 / aspect;
  const cy = (gy + ty) / 2 + 0.01;
  return { x: gx - w / 2, y: cy - h / 2, w, h, aspect };
}

// Time of day by the visitor's clock.
export function daylightNow(date = new Date()) {
  const hour = date.getHours();
  return hour >= 5 && hour < 9 ? 'morning' : hour >= 9 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'sunset' : 'night';
}
