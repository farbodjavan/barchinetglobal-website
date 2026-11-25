// Barchinet World prototype: sample data.
// Every office, person, project, record number and message in this file is fictional.
// Nothing here is a real practice, client, address or contact detail.

export const PROJECT = {
  id: 'CH-0142',
  name: 'Cypress House',
  place: 'Los Angeles',
  summary: 'A fictional courtyard house. The family wants to see the courtyard from the sofa, stay shaded in summer and keep low sun in winter.',
  questions: [
    'Is the canopy deep enough for the wide living-room opening?',
    'Would a deeper or a shallower canopy suit the living room better?',
    'How do we keep low winter sun off the table without losing the view?'
  ]
};

export const NEEDS = [
  { id: 'bright', label: 'Too much sun by the window', office: 'serein', service: 'Daylight and shade check' },
  { id: 'comfort', label: 'Hard to keep a room warm or cool', office: 'serein', service: 'Envelope review' },
  { id: 'dark', label: 'The room is too dark', office: 'meridian', service: 'Daylight review' },
  { id: 'layout', label: 'I need a layout or a concept', office: 'fold', service: 'Two-option layout study' },
  { id: 'learn', label: 'Learn with my family', office: 'common-ground', service: 'Shade Lab activity' }
];

export const OFFICES = [
  {
    id: 'serein', name: 'Serein Envelope', city: 'Los Angeles', country: 'United States', lat: 34.05, lon: -118.24,
    kind: 'Specialist office', has3d: true,
    tagline: 'Building envelope, shade and thermal comfort for homes in warm climates.',
    lead: { name: 'Dana Whitlock', role: 'Envelope lead' },
    specialties: ['Shading and canopies', 'Wall and roof assemblies', 'Summer comfort'],
    services: [
      { id: 'daylight', mode: 'instant', name: 'Daylight and shade check', blurb: 'Change the opening, the canopy and the sun. See the result at once.' },
      { id: 'review', mode: 'human', name: 'Envelope review', blurb: 'Send a brief. A person reads it and replies with scope and next steps.' }
    ],
    note: 'Pilot office. Cypress House is on the review table.', thumb: 'assets/stills/winter-noon-interior.thumb.jpg'
  },
  {
    id: 'meridian', name: 'Meridian Daylight', city: 'Rotterdam', country: 'Netherlands', lat: 51.92, lon: 4.48,
    kind: 'Specialist office', has3d: false,
    tagline: 'Daylight, glare and view studies for rooms people actually sit in.',
    lead: { name: 'Ilse Vermaat', role: 'Daylight specialist' },
    specialties: ['Glare at desks and tables', 'Daylight in deep rooms', 'View and privacy'],
    services: [
      { id: 'glare', mode: 'human', name: 'Daylight and glare review', blurb: 'A specialist studies the hours that matter and suggests one change.' }
    ],
    sample: 'Sample deliverable: a one-page hour-by-hour sun study with one recommended change and what it costs in view.'
  },
  {
    id: 'fold', name: 'Fold Atelier', city: 'Muscat', country: 'Oman', lat: 23.59, lon: 58.41,
    kind: 'Design studio', has3d: false,
    tagline: 'Small houses and courtyards, drawn as two clear options before anything is built.',
    lead: { name: 'Rami Haddad', role: 'Studio principal' },
    specialties: ['Courtyard houses', 'Living-room layouts', 'Concept design'],
    services: [
      { id: 'layout', mode: 'human', name: 'Two-option layout study', blurb: 'Two layouts for one room and a review meeting.' }
    ],
    sample: 'Sample deliverable: two living-room layouts for Cypress House, each with the view from the sofa marked.'
  },
  {
    id: 'common-ground', name: 'Common Ground', city: 'Online', country: 'Family workshop', lat: null, lon: null,
    kind: 'Public-benefit workshop', has3d: false,
    tagline: 'Free activities that help families understand buildings by changing one thing and watching what happens.',
    lead: { name: 'Workshop team', role: 'Facilitators' },
    specialties: ['Shade and sun', 'Rooms and light', 'Play together'],
    services: [
      { id: 'shade-lab', mode: 'instant', name: 'Shade Lab', blurb: 'Pick a canopy for a reading room. Test it in high and low sun.' }
    ],
    sample: 'A learning activity concept. No partner, school or library has agreed to host it.'
  }
];

export const office = id => OFFICES.find(o => o.id === id);

// Scripted, simulated replies. No message leaves this browser.
export const SCRIPT = {
  received: o => `${o.lead.name} at ${o.name} has your brief and the attached check.`,
  reply: 'We can review the canopy and the opening. The low winter sun across the table is a glare question, and that is not our field. Meridian Daylight in Rotterdam does exactly this. May we share this brief and your check result with them? Nothing else would be shared.',
  accepted: 'Ilse Vermaat at Meridian Daylight accepted the handoff. She will study December sun at the review table. Serein Envelope stays responsible for the canopy.',
  declined: 'Understood. The brief stays with Serein Envelope only. You can still visit Meridian Daylight yourself at any time.'
};
