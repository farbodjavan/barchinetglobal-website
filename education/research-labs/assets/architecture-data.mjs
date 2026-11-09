/**
 * Architecture teaching data, selected shared-conversation ideas 1, 3 and 6.
 * All project stories, authors, observations and discussions are fictional.
 * Images are AI-generated teaching illustrations, not authenticated student work.
 * API: archProjects (three app descriptors), courtyardProject (shared case),
 * archReferencesByApp (bibliographic arrays), archMaturityLevels (same ladder as
 * the disaster-recovery labs). Annotation coordinates use percentages (0..100).
 */
import { maturityLevels } from './references.mjs';
export const archMaturityLevels = maturityLevels;

const maturity = () => ({
  currentLevel: 1,
  label: 'Research — Interactive Demo',
  description: 'This level concerns research and product evidence, not interface polish. Fictional design studies demonstrate a possible workflow. No measured learning benefit, partner pilot, independent validation or operational community is claimed.',
  verifiedEvidence: [],
  levels: maturityLevels,
});

export const courtyardProject = {
  id: 'courtyard-study',
  title: 'A courtyard between light and privacy',
  subtitle: 'One fictional house. Three ways to make the thinking visible.',
  brief: 'Explore a modest courtyard house for a fictional multigenerational household. Invite daylight into shared rooms while keeping the entrance from looking directly into private space.',
  context: 'An invented compact urban site, an adjoining street and neighbouring walls. No actual city, client, cultural group or measured site data is represented.',
  researchQuestion: 'How can a design record help a learner explain what changed, why it changed and what remains uncertain?',
  originalPreserved: true,
  originalAssetLabel: 'Read-only AI-generated base study',
  preservationNotice: 'The base illustrations and prepared annotation layer are read-only. No authentic student original has been supplied in this demo.',
  illustrationNotice: 'AI-generated conceptual illustrations. They are not authenticated sketches, measured drawings, daylight analyses or build-ready documents.',
  reflectionNotice: 'The accompanying author reflections are fictional retrospective accounts, not observations or recordings of a real designer’s thoughts.',
  synthetic: true,
  privacy: { defaultVisibility: 'public-curated-demo', visitorSubmissions: false, automaticSharing: false, automaticTransfer: false, transferRequiresOptIn: true },
  participation: 'Anyone may read the prepared studies and conversations without owning or uploading a project. This curated demonstration accepts no visitor submissions.',
};

const notices = [
  'Fictional project, fictional contributors and synthetic discussion.',
  'AI-generated illustrations are clearly identified; no authenticity claim is made.',
  'The base drawings and prepared annotation layer stay unchanged while you explore.',
  'Public curated reading only. No visitor writing, uploads, automatic transfers or publishing.',
  'Conceptual learning only. No automatic CAD conversion, engineering certification or build-ready output.',
];

const stages = [
  {
    id: 'first-court', title: 'An open first thought', version: 'Study 01', focus: 'Daylight and shared space', imageKey: 'sketch-01',
    decision: 'Place shared rooms around a small open court and begin with a direct entrance route.',
    reflection: 'Looking back at this invented study, the courtyard seems to organise the rooms clearly. The direct route is easy to read, but I would need to investigate whether a visitor could see into the family room.',
    reflectionType: 'Retrospective demo reflection',
    annotations: [
      { id: 's1-court', x: 52, y: 46, label: 'Shared light', text: 'The open court is a design intention for shared daylight. No daylight performance has been simulated.' },
      { id: 's1-entry', x: 28, y: 69, label: 'Entry question', text: 'Trace the imagined arrival route. Where might an uninterrupted view meet private life?' },
      { id: 's1-room', x: 72, y: 40, label: 'Unresolved edge', text: 'Room relationships are a conceptual reading of an AI illustration, not an accurate architectural plan.' },
    ],
    nextQuestion: 'Could the entrance turn without making the route feel confusing?',
  },
  {
    id: 'offset-entry', title: 'A turn before the court', version: 'Study 02', focus: 'Threshold and privacy', imageKey: 'sketch-02',
    decision: 'Explore an offset entrance and a small screen before entering the shared court.',
    reflection: 'In this retrospective account, the turn is a response to the earlier privacy question. I would compare it with the first study rather than erase the first drawing: a quieter arrival might also reduce visual openness.',
    reflectionType: 'Retrospective demo reflection',
    annotations: [
      { id: 's2-screen', x: 34, y: 61, label: 'A layered threshold', text: 'The annotation records a proposed change: a screen and an indirect arrival. It does not claim the AI image was geometrically derived from Study 01.' },
      { id: 's2-sightline', x: 49, y: 48, label: 'Compare the view', text: 'Ask a peer to describe what could be seen on arrival. Record disagreement instead of treating privacy as a proven result.' },
      { id: 's2-court', x: 68, y: 35, label: 'Keep the court legible', text: 'Check whether the courtyard remains understandable from the entrance. This is a critique prompt, not a quantified score.' },
    ],
    nextQuestion: 'What might a shaded edge add to everyday use of the courtyard?',
  },
  {
    id: 'layered-edge', title: 'An edge to inhabit', version: 'Study 03', focus: 'Shade and everyday use', imageKey: 'sketch-03',
    decision: 'Explore a shaded veranda-like edge between the courtyard and an interior room.',
    reflection: 'I am using the third fictional study to ask about the space between inside and outside. A sheltered edge could support sitting and conversation, but its depth, climate response and accessibility would need real design work and user discussion.',
    reflectionType: 'Retrospective demo reflection',
    annotations: [
      { id: 's3-edge', x: 47, y: 58, label: 'In-between space', text: 'A sheltered edge introduces another possible way to inhabit the court. Its usefulness has not been tested with residents.' },
      { id: 's3-light', x: 63, y: 35, label: 'Light remains a question', text: 'Shade and daylight can conflict. Further work would need orientation, dimensions, climate data and appropriate analysis.' },
      { id: 's3-return', x: 29, y: 72, label: 'Return to the first study', text: 'Revisit the initial idea with the new question. The story is a sequence of readings and alternatives, not a claim that the design is finished.' },
    ],
    nextQuestion: 'Which question should be tested with people before developing another version?',
  },
];

const chapters = [
  {
    id: 'book-brief', title: '01 · A question worth keeping', subtitle: 'Brief and intent', stageId: 'first-court',
    text: 'The fictional brief asks for daylight and privacy in a compact courtyard house. This chapter records the question before presenting an attractive answer. The site and household are invented rather than observed.',
    prompts: ['Whose needs does the brief represent?', 'Which assumptions would require a conversation with actual residents?'],
    reflection: 'A clear question helps a future reader understand what the drawings were trying to investigate.',
  },
  {
    id: 'book-context', title: '02 · The life around the drawing', subtitle: 'Context and limits', stageId: 'first-court',
    text: 'Imagine a street edge, neighbouring walls and shared domestic life. These are scene-setting assumptions. Cultural practices cannot be inferred from a courtyard form alone; a real project would need listening, observation and consent.',
    prompts: ['What is known, imagined or still missing?', 'How would context change the meaning of privacy?'],
    reflection: 'Keeping uncertainty in the book is more useful than making an invented site sound researched.',
  },
  {
    id: 'book-first', title: '03 · The first marks', subtitle: 'The initial study', stageId: 'first-court',
    text: 'Keep the first base image intact. An annotation layer identifies the court, arrival route and an unresolved private edge. The notes are possible interpretations of an AI-generated study, not an authenticated record of a student’s original sketch.',
    prompts: ['Which mark or relation first caught your attention?', 'Can an annotation be removed without changing the base image?'],
    reflection: 'A rough beginning can carry an important question even when it would not be selected as a final presentation image.',
  },
  {
    id: 'book-changes', title: '04 · What changed, and why', subtitle: 'Alternative readings', stageId: 'offset-entry',
    text: 'The second conceptual study introduces the idea of an offset threshold. Compare the stated decisions side by side. The three AI illustrations are separate alternatives: they are not exact geometric edits or verified versions of one measured plan.',
    prompts: ['What was the intended benefit of the turn?', 'What might have been lost while addressing the privacy concern?'],
    reflection: 'A useful account connects a visible alternative to a reason and an unresolved trade-off.',
  },
  {
    id: 'book-dialogue', title: '05 · A question from someone else', subtitle: 'Critique and response', stageId: 'layered-edge',
    text: 'A fictional peer asks whether a shaded edge would still invite light into the room behind it. The book retains the question and a tentative response. It does not turn a peer comment into an expert approval or erase disagreement.',
    prompts: ['Does the comment describe an observation before offering advice?', 'Would you include a response, a drawing, or an unanswered question?'],
    reflection: 'Dialogue can help readers see how a design question became more specific.',
  },
  {
    id: 'book-next', title: '06 · What remains open', subtitle: 'Reflection and next steps', stageId: 'layered-edge',
    text: 'The collection ends with questions about daily use, climate, access and household preferences. A curated sketchbook can hold a meaningful learning record without claiming that its project is complete or ready to build.',
    prompts: ['What would you investigate with actual users?', 'Which chapter would you keep, reorder or leave private?'],
    reflection: 'This is a fictional retrospective reflection written for the demo. It is not a real-time record of a designer’s cognition.',
  },
];

const posts = [
  {
    id: 'post-threshold', title: 'When does an entrance become a threshold?', author: 'Samira Noor', role: 'Fictional student', topic: 'Privacy', stageId: 'offset-entry', imageKey: 'sketch-02',
    question: 'What would you ask about the turn before judging the arrangement?',
    text: 'I am comparing two conceptual arrival routes. I can describe the change, but I cannot yet say how the imagined household would experience it. What evidence would help?',
    tags: ['Arrival', 'Privacy', 'Open question'], synthetic: true,
    comments: [
      { id: 'threshold-c1', author: 'Eli Park', role: 'Fictional peer', text: 'I notice the entrance is less direct in the description. Could you add a separate sightline annotation and ask what a visitor sees first?' },
      { id: 'threshold-c2', author: 'Samira Noor', role: 'Fictional student', text: 'That would help distinguish my intention from an observed effect. I would keep the original study beside the new annotation.' },
    ],
  },
  {
    id: 'post-light', title: 'A shaded edge is also a daylight question', author: 'Eli Park', role: 'Fictional peer', topic: 'Light', stageId: 'layered-edge', imageKey: 'sketch-03',
    question: 'Which site information would you need before estimating daylight?',
    text: 'The sheltered courtyard edge looks inviting in the illustration. I would still need orientation, dimensions, adjacent obstructions and climate data before making a performance claim.',
    tags: ['Daylight', 'Shade', 'Evidence'], synthetic: true,
    comments: [{ id: 'light-c1', author: 'Rowan Lee', role: 'Fictional tutor', text: 'Start by separating a visual impression from a testable question. A beautiful image is not a daylight simulation.' }],
  },
  {
    id: 'post-memory', title: 'Let the brief hold more than a floor plan', author: 'Noor Das', role: 'Fictional observer', topic: 'Culture', stageId: 'first-court', imageKey: 'sketch-01',
    question: 'How could residents describe the kinds of gathering they want?',
    text: 'I do not have a project to upload. Reading this invented courtyard case makes me think about how daily routines and memories might change a brief. I would begin with questions rather than assign cultural meaning to the form.',
    tags: ['Everyday life', 'Listening', 'No project needed'], synthetic: true,
    comments: [{ id: 'memory-c1', author: 'Mina Sol', role: 'Fictional peer', text: 'A conversation prompt such as “where do people choose to sit together?” might reveal preferences that a drawing alone does not show.' }],
  },
  {
    id: 'post-critique', title: 'A critique that opens a possibility', author: 'Rowan Lee', role: 'Fictional tutor', topic: 'Critique', stageId: 'offset-entry', imageKey: 'sketch-02',
    question: 'Can you turn a judgment into an observation and a question?',
    text: 'Instead of “this entrance is wrong,” try describing the route you read and asking what the author intended. The aim is to support reasoning and dialogue, not to rank people or designs.',
    tags: ['Peer learning', 'Observation', 'Respect'], synthetic: true,
    comments: [{ id: 'critique-c1', author: 'Alex Reed', role: 'Fictional learner', text: 'I read the screen as a pause before the court. Was that the intended experience, and might the pause be different for someone with a mobility aid?' }],
  },
  {
    id: 'post-observe', title: 'Joining by noticing', author: 'Alex Reed', role: 'Fictional learner', topic: 'Observation', stageId: 'first-court', imageKey: 'sketch-01',
    question: 'What can a careful reader contribute without a finished project?',
    text: 'I am learning by reading the three studies and asking where the private and shared spaces meet. I can contribute a question or a reading without presenting my own design.',
    tags: ['Beginner welcome', 'Reading drawings', 'Participation'], synthetic: true,
    comments: [{ id: 'observe-c1', author: 'Samira Noor', role: 'Fictional student', text: 'Your question helps me see what the notes leave unclear. You do not need a portfolio or a completed project to join this learning conversation.' }],
  },
  {
    id: 'post-book', title: 'Keep the unresolved page', author: 'Mina Sol', role: 'Fictional peer', topic: 'Reflection', stageId: 'layered-edge', imageKey: 'sketch-03',
    question: 'Which question would make the sketchbook useful a year from now?',
    text: 'I would keep the page where shade and daylight remain in tension. A record of uncertainty can be more instructive than a polished image that suggests the answer was obvious.',
    tags: ['Sketchbook', 'Reflection', 'Learning record'], synthetic: true,
    comments: [{ id: 'book-c1', author: 'Rowan Lee', role: 'Fictional tutor', text: 'Label whether a reflection was written during the work or later. A retrospective account can be valuable without being a recording of the original thought process.' }],
  },
];

export const archProjects = [
  {
    id: 'sketch-story', title: 'Barchi Sketch Story', shortTitle: 'Sketch Story', kicker: '01 / A LIVING DESIGN STORY', imageKey: 'sketch-01', mediaKey: 'sketch-story',
    description: 'Keep the drawing. Reveal the decisions around it.',
    mission: 'Read three conceptual courtyard studies, explore prepared annotations and compare the intentions and questions behind each alternative.',
    question: 'How can an annotated version story make design decisions and open questions easier to discuss?',
    roles: [{ name: 'Student', goal: 'Explain what changed and why, without replacing the base drawing.' }, { name: 'Tutor', goal: 'Ask a question tied to a visible design decision.' }, { name: 'Curious reader', goal: 'Follow the design story without needing a project of your own.' }],
    stages, viewOnly: true, privacy: { ...courtyardProject.privacy }, notices: [...notices], maturity: maturity(),
    filmDescription: 'A camera approaches an open sketchbook of a courtyard house as a page turns. This AI-generated concept film is separate from the three annotated illustrations.',
    optionalTransfer: { enabledByDefault: false, target: 'project-sketchbook', label: 'Related project record', explanation: 'The related sketchbook is another curated view of the shared case. This demonstration does not copy, transfer or publish visitor material.' },
  },
  {
    id: 'project-sketchbook', title: 'Barchi Project Sketchbook', shortTitle: 'Project Sketchbook', kicker: '02 / A RECORD WORTH KEEPING', imageKey: 'sketch-02', mediaKey: 'project-sketchbook',
    description: 'Turn selected moments into an enduring project book.',
    mission: 'Explore six curated chapters connecting a brief, drawings, critique and reflection in the fictional courtyard inquiry.',
    question: 'What should a project book preserve so another reader can understand its questions, changes and limits?',
    roles: [{ name: 'Student', goal: 'Curate a learning record with reasons, questions and clear provenance.' }, { name: 'Tutor', goal: 'Read a coherent inquiry across drawings and reflections.' }, { name: 'Project reader', goal: 'Understand the context and unresolved questions, not just the final image.' }],
    chapters, stages, viewOnly: true, privacy: { ...courtyardProject.privacy }, notices: [...notices], maturity: maturity(),
    filmDescription: 'A camera moves across a project sketchbook containing a plan, a section and a courtyard perspective. The AI-generated film illustrates a record, rather than reproducing the selected chapter.',
    optionalTransfer: { enabledByDefault: false, target: 'sketch-community', label: 'Related studio readings', explanation: 'The related studio exchange contains prepared fictional readings. No excerpts or visitor material are transferred or published.' },
  },
  {
    id: 'sketch-community', title: 'Barchi Sketch Community', shortTitle: 'Sketch Community', kicker: '03 / LEARN THROUGH DIALOGUE', imageKey: 'sketch-03', mediaKey: 'sketch-community',
    description: 'A place for thoughtful questions, shared learning and cultural conversation.',
    mission: 'Read six fictional studio exchanges, including observations, questions and responses. No project or visitor reply is required.',
    question: 'How can a community support thoughtful participation around sketches without turning learning into a popularity contest?',
    roles: [{ name: 'Learner', goal: 'Notice how a specific observation can become a useful question, with or without a project of your own.' }, { name: 'Project author', goal: 'Follow how the fictional author distinguishes a design intention from an observed effect.' }, { name: 'Tutor / facilitator', goal: 'Look for respectful inquiry, missing context and different readings of the work.' }],
    posts, stages, viewOnly: true, privacy: { ...courtyardProject.privacy }, notices: [...notices, 'The studio exchanges and all participants are fictional, prepared examples. There is no live discussion or messaging.'], maturity: maturity(),
    filmDescription: 'A camera moves over separate sheets showing different courtyard-house studies, linked by a terracotta thread. This AI-generated concept film does not depict real contributors or a live community.',
    participation: courtyardProject.participation,
    communityPrinciples: ['Observe before judging.', 'Ask about intention and context.', 'Discuss the work without ranking its author.', 'Welcome participants who have no project.', 'Share only material you choose and have the right to share.'],
    optionalTransfer: { enabledByDefault: false, target: null, label: 'Keep participation voluntary', explanation: 'No automatic import, publishing, ranking or transfer between apps.' },
  },
];

export const archQuickStartByApp = {
  'sketch-story': [
    { title: 'Choose a study', text: 'Use the study list or the arrows below the drawing. Begin with the open courtyard.', label: 'Open Study 01', target: { selected: 0, pin: 0 }, focus: 'contents' },
    { title: 'Read a numbered observation', text: 'Select a pin on the drawing to reveal its note in the reading panel. Try the entrance question.', label: 'Read the entry question', target: { selected: 0, pin: 1 }, focus: 'reading' },
    { title: 'Compare two intentions', text: 'Compare studies places two alternatives side by side. Use the comparison selector to change the other study.', label: 'Compare Study 01 + 03', target: { selected: 2, pin: 0, compare: true, baseline: 0 }, focus: 'comparison' },
  ],
  'project-sketchbook': [
    { title: 'Open a chapter', text: 'Use the chapter list or Previous and Next. The brief explains the question before the drawings.', label: 'Read the brief', target: { selected: 0 }, focus: 'canvas' },
    { title: 'Follow what changed', text: 'Read the chapter, its reflection and the questions in the reading panel. The fourth chapter compares intentions.', label: 'Read what changed', target: { selected: 3 }, focus: 'reading' },
    { title: 'Keep the whole record', text: 'Print record prepares all six chapters, their questions and references. You can review the print preview before saving or printing.', label: 'Print all six chapters', action: 'print' },
  ],
  'sketch-community': [
    { title: 'Choose a design question', text: 'Select a topic in the question list. Begin with the proposed entrance and privacy.', label: 'Read the privacy question', target: { selected: 0, phase: 0 }, focus: 'reading' },
    { title: 'Follow the exchange', text: 'Read the observation, question, peer reading and the author response. Each is a prepared fictional example.', label: 'Highlight the author response', target: { selected: 0, phase: 3 }, focus: 'reading' },
    { title: 'Try another reading', text: 'Compare how the inquiry changes for daylight, culture or access. You can explore every reply without submitting anything.', label: 'Read the daylight exchange', target: { selected: 1, phase: 0 }, focus: 'reading' },
  ],
};

const sketchProtocol = {
  type: 'Peer-reviewed research article',
  title: "Macroscopic analysis of design processes based on a scheme for coding designers' cognitive actions",
  authors: ['Masaki Suwa', 'Terry Purcell', 'John Gero'], year: 1998,
  doi: '10.1016/S0142-694X(98)00016-7',
  url: 'https://keio.elsevierpure.com/ja/publications/macroscopic-analysis-of-design-processes-based-on-a-scheme-for-co/',
  publisher: 'Design Studies, 19(4), 455–483 · Elsevier; author record at Keio University',
  usedFor: 'Distinguishing visible drawing actions, perceptions, functions and concepts when discussing a design process.',
  limitation: 'The study analyses recorded design protocols. These fictional retrospective notes do not reproduce that protocol or establish what a real designer was thinking.',
};
const reflection = {
  type: 'Primary scholarly book',
  title: 'The Reflective Practitioner: How Professionals Think in Action',
  authors: ['Donald A. Schön'], year: 1992,
  url: 'https://www.routledge.com/The-Reflective-Practitioner-How-Professionals-Think-in-Action/Schon/p/book/9781857423198',
  publisher: 'Routledge · publisher-listed edition, copyright 1992',
  usedFor: 'Framing design practice as inquiry and reflection around a developing situation.',
  limitation: 'The cited edition is the publisher-listed 1992 edition. A fictional reflection written after a drawing is not direct evidence of reflection-in-action or proof of educational effectiveness.',
};
const studio = {
  type: 'University teaching practice',
  title: 'Architecture Studio: Intentions (4.104), Spring 2005',
  authors: ['Joel Turkel'], year: 2005,
  url: 'https://ocw.mit.edu/courses/4-104-architecture-studio-intentions-spring-2005/',
  publisher: 'Massachusetts Institute of Technology · MIT OpenCourseWare',
  usedFor: 'A primary example of architectural learning through drawings, precedent analysis, design methods and peer studio review.',
  limitation: 'A course example, not an evaluation of these apps. No MIT student images, assignments or critique transcripts are reproduced, and no institutional endorsement is implied.',
};
const trace = {
  type: 'Industrial product reference',
  title: 'Morpholio Trace — official product overview',
  authors: ['Morpholio'], year: 'n.d.',
  url: 'https://morpholioapps.com/trace/',
  publisher: 'Morpholio',
  usedFor: 'A real product example showing that sketching, annotation and layer control can form a dedicated architectural workflow.',
  limitation: 'An undated vendor capability page, not an academic validation. Barchinet does not reproduce Trace, connect to it or claim its CAD, measurement or export capabilities.',
};
const participation = {
  type: 'Primary scholarly book',
  title: 'Situated Learning: Legitimate Peripheral Participation',
  authors: ['Jean Lave', 'Etienne Wenger'], year: 1991,
  doi: '10.1017/CBO9780511815355',
  url: 'https://www.cambridge.org/highereducation/books/situated-learning/6915ABD21C8E4619F750A4D4ACA616CD',
  publisher: 'Cambridge University Press',
  usedFor: 'Framing learning as social participation, including ways newcomers can begin by observing and contributing gradually.',
  limitation: 'A theoretical account of learning and practice, not evidence that an online gallery produces learning gains. This demo has no real community or measured participation outcomes.',
};

export const archReferencesByApp = {
  'sketch-story': [{ ...sketchProtocol }, { ...reflection }, { ...trace }],
  'project-sketchbook': [{ ...sketchProtocol }, { ...reflection }, { ...studio }],
  'sketch-community': [{ ...participation }, { ...studio }, { ...reflection }],
};

const boundedIndex = (value, length) => Math.max(0, Math.min(length - 1, Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0));

/** Two distinct conceptual alternatives, never an overlay or measured difference. */
export function archComparisonPair(selected, preferredBaseline) {
  const current = boundedIndex(selected, stages.length);
  const requested = preferredBaseline == null ? current - 1 : Number(preferredBaseline);
  const baseline = Number.isInteger(requested) && requested >= 0 && requested < stages.length && requested !== current
    ? requested : current === 0 ? 1 : current - 1;
  return [baseline, current];
}

/** Preserve every prepared response, including the author's reply to a peer. */
export function archExchangeReadings(post) {
  return [
    { label: 'Observation', text: post.text, author: post.author, role: post.role },
    { label: 'Question', text: post.question, author: 'Curated prompt', role: 'Prepared discussion question' },
    ...post.comments.map(comment => ({
      label: comment.author === post.author ? 'Author response' : 'Peer reading',
      text: comment.text, author: comment.author, role: comment.role,
    })),
  ];
}

/** One finite guided tour. A completed tour keeps its last reading on screen. */
export function archPlaybackStep(appId, state = {}) {
  const project = archProjects.find(item => item.id === appId);
  if (!project) throw new RangeError('Unknown architecture app');
  const list = appId === 'sketch-story' ? stages : appId === 'project-sketchbook' ? chapters : posts;
  const selected = boundedIndex(state.selected, list.length);
  const pin = appId === 'sketch-story' ? boundedIndex(state.pin, stages[selected].annotations.length) : 0;
  const phase = appId === 'sketch-community' ? boundedIndex(state.phase, archExchangeReadings(posts[selected]).length) : 0;
  const current = { selected, pin, phase, ended: false };
  if (appId === 'sketch-story' && pin + 1 < stages[selected].annotations.length) return { ...current, pin: pin + 1 };
  if (appId === 'sketch-community' && phase + 1 < archExchangeReadings(posts[selected]).length) return { ...current, phase: phase + 1 };
  if (selected + 1 < list.length) return { selected: selected + 1, pin: 0, phase: 0, ended: false };
  return { ...current, ended: true };
}
