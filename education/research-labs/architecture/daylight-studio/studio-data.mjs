// One description of the placeholder courtyard studio, used for both the SVG plan and the stand-in 3D model.
// Metres. Plan x runs east, plan y runs south (north is up); in 3D that is X and Z, with Y up.
// When the baked Blender model is installed, only `rooms`, `hotspots` and the plan linework are still used;
// update them (or supply the same fields in manifest.json) if the baked design differs.
export const H = 2.8; // room height
const EXT = .25, INT = .15, GARDEN = 2;

export const studio = {
  title: 'GROUND FLOOR PLAN',
  bounds: [0, 0, 10, 10],
  north: 0,
  origin: [-5, -5], // world X, Z of plan (0, 0)
  rooms: [
    { id: 'studio', number: '1', name: 'Studio', hatch: 'timber', poly: [[.25, .25], [6.925, .25], [6.925, 5.475], [.25, 5.475]], label: [4.3, 4.3], view: { azimuth: 2.6, elevation: .95, distance: .62 } },
    { id: 'kitchen', number: '2', name: 'Kitchenette', hatch: 'tile', poly: [[7.075, .25], [9.75, .25], [9.75, 2.725], [7.075, 2.725]], label: [8.4, 1.75], view: { azimuth: 3.6, elevation: 1.0, distance: .42 } },
    { id: 'bath', number: '3', name: 'Bath', hatch: 'tile', poly: [[7.075, 2.875], [9.75, 2.875], [9.75, 5.475], [7.075, 5.475]], label: [8.3, 4.05], view: { azimuth: 3.6, elevation: 1.0, distance: .42 } },
    { id: 'courtyard', number: '4', name: 'Courtyard', hatch: 'paving', poly: [[.25, 5.725], [9.75, 5.725], [9.75, 9.75], [.25, 9.75]], label: [5.9, 7.9], view: { azimuth: .5, elevation: .5, distance: .7 } },
  ],
  // Walls are centre lines, already split around openings. h is height in metres (default room height).
  walls: [
    { x1: 0, y1: .125, x2: 1.5, y2: .125, t: EXT }, { x1: 4.5, y1: .125, x2: 7.8, y2: .125, t: EXT }, { x1: 9, y1: .125, x2: 10, y2: .125, t: EXT },
    { x1: .125, y1: 0, x2: .125, y2: 1.5, t: EXT }, { x1: .125, y1: 3.5, x2: .125, y2: 5.6, t: EXT },
    { x1: 9.875, y1: 0, x2: 9.875, y2: 3.6, t: EXT }, { x1: 9.875, y1: 4.6, x2: 9.875, y2: 5.6, t: EXT },
    { x1: 0, y1: 5.6, x2: 1.2, y2: 5.6, t: EXT }, { x1: 5.3, y1: 5.6, x2: 10, y2: 5.6, t: EXT },
    { x1: 7, y1: .25, x2: 7, y2: 1.1, t: INT }, { x1: 7, y1: 1.95, x2: 7, y2: 3.5, t: INT }, { x1: 7, y1: 4.35, x2: 7, y2: 5.475, t: INT },
    { x1: 7.075, y1: 2.8, x2: 9.75, y2: 2.8, t: INT },
    { x1: .125, y1: 5.725, x2: .125, y2: 10, t: EXT, h: GARDEN }, { x1: 9.875, y1: 5.725, x2: 9.875, y2: 10, t: EXT, h: GARDEN },
    { x1: .25, y1: 9.875, x2: 7.9, y2: 9.875, t: EXT, h: GARDEN }, { x1: 8.85, y1: 9.875, x2: 9.75, y2: 9.875, t: EXT, h: GARDEN },
  ],
  // sill and head in metres; full-height glazing has sill 0.
  windows: [
    { x1: 1.5, y1: .125, x2: 4.5, y2: .125, t: EXT, sill: .95, head: 2.3 }, { x1: 7.8, y1: .125, x2: 9, y2: .125, t: EXT, sill: 1.1, head: 2.3 },
    { x1: .125, y1: 1.5, x2: .125, y2: 3.5, t: EXT, sill: .95, head: 2.3 }, { x1: 9.875, y1: 3.6, x2: 9.875, y2: 4.6, t: EXT, sill: 1.5, head: 2.3 },
    { x1: 1.2, y1: 5.6, x2: 4.3, y2: 5.6, t: EXT, sill: 0, head: 2.45 },
  ],
  doors: [
    { x: 4.35, y: 5.6, w: .95, along: 0, swing: -1 }, { x: 7, y: 1.1, w: .85, along: 90, swing: 1 }, { x: 7, y: 3.5, w: .85, along: 90, swing: 1 }, { x: 7.9, y: 9.875, w: .95, along: 0, swing: -1 },
  ],
  // type/x/y/w/h draw the plan symbol; z0, height and material build the stand-in 3D piece.
  furniture: [
    { type: 'rect', x: 1.6, y: .45, w: 2.6, h: .8, height: .74, material: 'timber', name: 'desk' },
    { type: 'rect', x: 2.6, y: 1.45, w: .5, h: .5, height: .45, material: 'fabric' },
    { type: 'rect', x: 4.7, y: 1.7, w: 1.7, h: 1.0, height: .9, material: 'timber', name: 'drawing table' },
    { type: 'rect', x: .45, y: 3.7, w: .9, h: 1.7, height: .42, material: 'fabric', name: 'sofa' },
    { type: 'rect', x: 1.7, y: 4.1, w: .9, h: .9, height: .35, material: 'timber' },
    { type: 'rect', x: 6.5, y: 2.1, w: .35, h: 1.3, height: 2.0, material: 'timber', name: 'shelf' },
    { type: 'rect', x: 7.2, y: .35, w: 2.45, h: .6, height: .9, material: 'stone', name: 'counter' },
    { type: 'rect', x: 9.0, y: 3.0, w: .6, h: .45, height: .85, material: 'paint' },
    { type: 'circle', x: 9.3, y: 5.0, r: .24, height: .42, material: 'paint' },
    { type: 'rect', x: 7.2, y: 4.55, w: .9, h: .85, height: .1, material: 'stone' },
    { type: 'rect', x: 5.6, y: 9.05, w: 2.0, h: .45, height: .44, material: 'timber', name: 'bench' },
    { type: 'tree', x: 2.6, y: 7.9, r: 1.35, height: 4.2 },
    { type: 'rect', x: 8.5, y: 6.0, w: 1.15, h: 1.9, height: .4, material: 'concrete', name: 'planter' },
    { type: 'dashed', points: [[-.5, -.5], [10.5, -.5], [10.5, 6.5], [-.5, 6.5]], closed: true }, // roof line above
  ],
  dims: [
    { from: [0, 0], to: [10, 0], offset: -1.4 }, { from: [0, 0], to: [7, 0], offset: -.75, text: '7.00 m' }, { from: [7, 0], to: [10, 0], offset: -.75, text: '3.00 m' },
    { from: [0, 0], to: [0, 5.725], offset: 1.4, text: '5.73 m' }, { from: [0, 5.725], to: [0, 10], offset: 1.4, text: '4.28 m' },
  ],
  notes: [{ x: .5, y: 6.82, text: 'roof line above', anchor: 'start' }],
  sectionMark: { x1: -1.2, x2: 11.2, y: 3.0, label: 'A' },
  hotspots: [
    { anchor: 'desk', label: 'Desk at the north window', at: [2.9, 1.2, .85], text: 'North light is even through the day, which is why the desk sits here.', view: { azimuth: 2.9, elevation: .5, distance: .34 } },
    { anchor: 'glazing', label: 'Courtyard glazing', at: [2.75, 1.4, 5.6], text: 'Full-height glass to the south. The roof overhang shades it at midday and lets low sun in.', view: { azimuth: .25, elevation: .22, distance: .5 } },
    { anchor: 'tree', label: 'Courtyard tree', at: [2.6, 3.4, 7.9], text: 'The tree filters afternoon sun before it reaches the glass.', view: { azimuth: .9, elevation: .42, distance: .55 } },
    { anchor: 'kitchen', label: 'Kitchenette', at: [8.4, 1.3, 1.2], text: 'A small counter with its own north window.', view: { azimuth: 3.7, elevation: .8, distance: .36 } },
  ],
};

// plan (x, y) and a height -> world [X, Y, Z]
export const toWorld = (x, y, height = 0, origin = studio.origin) => [x + origin[0], height, y + origin[1]];
export const roomCentre = room => room.poly.reduce((a, p) => [a[0] + p[0] / room.poly.length, a[1] + p[1] / room.poly.length], [0, 0]);
