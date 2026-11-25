// Barchinet World prototype: what the page knows about the Courtyard studio (the fictional Los Angeles office).
// Light states, layers, anchors, camera poses, captions and stills. No three.js here, so it also serves the 2D fallback.

export const STATES = {
  'winter-noon': { label: 'Winter noon', sub: 'December 21, 12:00', overlay: 'winter', stills: ['exterior', 'interior', 'table', 'courtyard'],
    note: 'Low noon sun passes under the canopy and reaches about 2.9 m into the room.', sky: [[0.20, 0.33, 0.47], [0.62, 0.69, 0.74], [0.60, 0.58, 0.54]] },
  'summer-noon': { label: 'Summer noon', sub: 'June 21, 12:00', overlay: 'summer', stills: ['interior'],
    note: 'High noon sun. The 1.6 m canopy shades the whole bay, so no direct sun enters.', sky: [[0.22, 0.40, 0.62], [0.70, 0.78, 0.85], [0.66, 0.64, 0.60]] },
  'late-afternoon': { label: 'Late afternoon', sub: 'Low sun from the west', overlay: null, stills: ['exterior', 'interior', 'table', 'courtyard'],
    note: 'Low sun from the west rakes across the courtyard and lights the bay from the side.', sky: [[0.36, 0.50, 0.66], [0.86, 0.80, 0.72], [0.70, 0.64, 0.56]] },
  evening: { label: 'Evening', sub: 'After sunset, lights on', overlay: null, stills: ['exterior', 'interior', 'table', 'courtyard'],
    note: 'After sunset the room is lit by its pendants, track lights and the floor lamp.', sky: [[0.10, 0.14, 0.24], [0.16, 0.20, 0.31], [0.12, 0.13, 0.17]] }
};
export const STATE_ORDER = ['winter-noon', 'summer-noon', 'late-afternoon', 'evening'];
export const modelUrl = state => `assets/models/courtyard-studio.${state}.glb`;
export const stillUrl = (state, view, thumb = false) => `assets/stills/${state}-${view}${thumb ? '.thumb' : ''}.jpg`;
// Nearest still for a state and a view (summer noon has only the interior).
export function stillFor(state, view) { const s = STATES[state].stills; return stillUrl(state, s.includes(view) ? view : s.includes('interior') ? 'interior' : s[0]); }

export const LAYERS = ['Roof and ceiling', 'Walls', 'Glazing', 'Timber and joinery', 'Steel frames and fittings', 'Floor and rug', 'Furniture and models', 'Lamps and screens', 'Planting', 'Site and courtyard paving', 'Street and neighbours'];

// Anchors match the ANCHOR_ nodes in the models and the data-anchor values in the plan drawing.
// pos: where the camera stands. The camera looks at the anchor (or at "look" when given). still: closest path-traced view.
export const ANCHORS = {
  entry: { label: 'Entry', pos: [-5.9, 1.62, -1.2], look: [1.2, 1.0, 1.9], still: 'interior', onPlan: true,
    text: 'You come in through the west door. The whole studio is one room, 14 by 9 metres, with timber beams overhead.' },
  desks: { label: 'Desks', pos: [0.2, 1.6, -0.9], look: [0.2, 0.9, -3.7], still: 'interior', onPlan: true,
    text: 'Four desks line the north wall, away from direct sun.' },
  material_library: { label: 'Material library', pos: [3.4, 1.6, -1.0], still: 'interior', onPlan: true,
    text: 'Samples and books on open shelves in the north-east corner.' },
  review_table: { label: 'Review table', pos: [4.7, 1.62, -0.7], still: 'table', onPlan: true,
    text: 'The review table sits two metres inside the bay. Briefs are discussed here, and this is where low winter sun lands.' },
  cypress_house_model: { label: 'Cypress House model', pos: [0.9, 1.42, -0.15], look: [0.9, 0.85, 1.5], still: 'table', onPlan: false, planAnchor: 'review_table',
    text: 'On the table: a card model of Cypress House, the fictional courtyard house used as the sample project.' },
  pin_up_wall: { label: 'Pin-up wall', pos: [-3.0, 1.6, 0.4], still: 'table', onPlan: true,
    text: 'Drawings go up on the cork board on the west wall, next to the sofa.' },
  bay_opening: { label: 'Glazed courtyard bay', pos: [-2.4, 1.6, 0.9], look: [1.8, 1.3, 4.35], still: 'table', onPlan: true,
    text: 'The bay is 6.0 m wide and 2.8 m high and faces south onto the courtyard. Timber fins stand outside the glass.' },
  canopy: { label: 'Canopy', pos: [-3.2, 1.6, 8.3], look: [1.2, 2.5, 4.9], still: 'courtyard', onPlan: false, planAnchor: 'bay_opening',
    text: 'A timber canopy projects 1.6 m over the bay. It blocks high summer sun and lets low winter sun pass under it.' },
  courtyard: { label: 'Courtyard', pos: [-0.9, 1.65, 10.1], look: [1.3, 1.6, 4.4], still: 'courtyard', onPlan: true,
    text: 'A walled courtyard, 15.2 by 6.4 metres, with concrete pavers, a bench and an olive tree.' },
  room_centre: { label: 'Whole studio, roof off', pos: [0.6, 14.5, 9.8], look: [0.3, 0, 0.8], still: 'exterior', onPlan: false, roofOff: true,
    text: 'With the roof off you can read the plan in three dimensions: desks north, table at the bay, courtyard south.' }
};
export const WALK = ['entry', 'desks', 'material_library', 'review_table', 'cypress_house_model', 'pin_up_wall', 'bay_opening', 'canopy', 'courtyard', 'room_centre'];
export const PLAN_HOTSPOTS = WALK.filter(id => ANCHORS[id].onPlan);

// Anchor positions as authored in the models (metres, Y up). Used for hotspots before a model has loaded.
export const ANCHOR_AT = {
  bay_opening: [1.2, 1.45, 4.35], canopy: [1.2, 3.12, 5.3], courtyard: [0, 0.05, 7.7], cypress_house_model: [0.9, 0.8, 1.5], desks: [0, 0.76, -3.7],
  entry: [-7, 1.1, -1.2], material_library: [6.5, 1.2, -3], pin_up_wall: [-6.68, 1.55, 2.2], review_table: [1.2, 0.77, 1.5], room_centre: [0, 1.5, 0]
};

export const GALLERY = STATE_ORDER.flatMap(state => STATES[state].stills.map(view => ({ state, view, src: stillUrl(state, view), thumb: stillUrl(state, view, true),
  alt: `${STATES[state].label}: ${{ exterior: 'the studio and its walled courtyard seen from above the street', interior: 'the studio interior seen from the entry', table: 'the review table with the Cypress House model, looking towards the bay', courtyard: 'the glazed bay, timber fins and canopy seen from the courtyard' }[view]}.`,
  caption: `${STATES[state].label} · ${view}` })))
  .concat([{ state: 'summer-noon', view: 'plan', src: stillUrl('summer-noon', 'plan'), thumb: stillUrl('summer-noon', 'plan', true), alt: 'Summer noon: plan view of the studio and courtyard rendered from directly above with the roof removed.', caption: 'Summer noon · plan, roof off' }]);
