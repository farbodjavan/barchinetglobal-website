import { Three, addBlock, createModelViewer, materials } from '../../assets/model-viewer.mjs?v=2';
import { drawPlan, bindPlan } from '../../assets/plan-kit.mjs?v=1';
// A10 as an architectural drawing. Geometry matches the 3D pavilion: plan x = model X + 7.5, plan y = model Z + 5.
const pavilionPlan = issue => ({
  title: `A10 FLOOR PLAN · REV ${issue.planRevision}`,
  bounds: [0, 0, 15, 10], pad: 2.6, scaleBar: [0, 1, 2, 5],
  site: [[0, 0], [15, 0], [15, 10], [0, 10]],
  rooms: [
    { id: 'alcove', number: '1', name: 'Book alcove', hatch: 'timber', poly: [[1.5, 1.3], [5.6, 1.3], [5.6, 3.3], [1.5, 3.3]], label: [3.6, 2.75] },
    { id: 'reading', number: '2', name: 'Reading room', hatch: 'timber', poly: [[1.5, 3.3], [5.6, 3.3], [5.6, 1.3], [13.5, 1.3], [13.5, 8.7], [1.5, 8.7]], label: [10.6, 3.2] },
    { id: 'plinth', name: 'Stone plinth', hatch: 'paving', poly: [[0, 0], [15, 0], [15, 10], [0, 10], [0, 0], [1.5, 1.3], [1.5, 8.7], [13.5, 8.7], [13.5, 1.3], [1.5, 1.3]], label: [7.5, .62], showArea: false, selectable: false },
  ],
  walls: [{ x1: 1.85, y1: 1.9, x2: 1.85, y2: 5.4, t: .1 }],
  columns: [1.85, 5.6, 9.4, 13.15].flatMap(x => [[x, 1.77, .2], [x, 8.23, .2]]),
  grid: [{ x: 1.85, label: '1' }, { x: 5.6, label: '2' }, { x: 9.4, label: '3' }, { x: 13.15, label: '4' }, { y: 1.77, label: 'A' }, { y: 8.23, label: 'B' }],
  furniture: [
    ...[3.3, 6.6, 9.8].flatMap(x => [{ type: 'rect', x: x - 1.05, y: 4.95, w: 2.1, h: .95 }, { type: 'rect', x: x - .85, y: 4.25, w: 1.7, h: .38 }, { type: 'rect', x: x - .85, y: 6.24, w: 1.7, h: .38 }]),
    { type: 'rect', x: 2.0, y: 1.88, w: 3.2, h: .55 }, ...[2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8].map(x => ({ type: 'line', points: [[x, 1.88], [x, 2.43]] })),
    { type: 'steps', x: 5.6, y: 8.72, w: 4, going: .32, count: 3 },
    { type: 'tree', x: .75, y: 2.2, r: .7 }, { type: 'tree', x: 14.25, y: 2.2, r: .7 },
    { type: 'dashed', points: [[1.1, .9], [13.9, .9], [13.9, 9.1], [1.1, 9.1]], closed: true },
  ],
  dims: [{ from: [1.5, 1.3], to: [13.5, 1.3], offset: -2.0, text: '12.00 m' }, { from: [1.5, 1.3], to: [1.5, 8.7], offset: 2.6, text: '7.40 m' }],
  sectionMark: { x1: -1.6, x2: 16.6, y: 7.4, label: 'A20' },
  notes: [{ x: 10, y: 9.5, text: issue.planCanopy, cls: 'canopy-note', anchor: 'start' }, { x: 1.2, y: .78, text: 'roof line above', anchor: 'start' }],
});


const sheets = {
  A00: { title: 'Drawing index' },
  A10: { title: 'Floor plan' },
  A20: { title: 'Transverse section' },
  A30: { title: 'Eave detail' },
};

const issues = {
  draft: { number: '01', indexRevision: 'A', planRevision: 'B', detailCallout: '01 / A31', planCanopy: 'West canopy' },
  revised: { number: '02', indexRevision: 'B', planRevision: 'B', detailCallout: '01 / A30', planCanopy: 'Entry canopy' },
};

const eaveDetail = '01 / A30';
const sectionCanopy = 'Entry canopy';

function makePavilion(viewer) {
  const model = new Three.Group();
  const roof = new Three.Group();
  const timber = materials.timber('#c5965b');
  const cedar = materials.timber('#8b5a35');
  const stone = materials.stone('#9eac9b');
  const card = materials.plaster('#e7d9ab');
  const roofTile = materials.metal('#8fb0b2');
  const moss = materials.foliage('#688879');
  const seats = materials.fabric('#aa624d');
  const block = (surface, size, position) => addBlock(model, surface, size, position);
  block(stone, [15, .25, 10], [0, .03, 0]);
  block(cedar, [12, .28, 7.4], [0, .29, 0]);
  for (let index = 0; index < 23; index++) {
    block(index % 5 ? timber : card, [.508, .065, 7.36], [-5.73 + index * .52, .46, 0]);
  }
  for (const x of [-5.65, -1.9, 1.9, 5.65]) {
    for (const z of [-3.23, 3.23]) block(cedar, [.2, 3.2, .2], [x, 2.04, z]);
  }
  for (let index = 0; index < 19; index++) {
    block(timber, [.085, 2.88, .1], [-5.65, 1.96, -3.05 + index * .18]);
  }
  block(card, [11.7, .29, .17], [0, 3.44, -3.23]);
  block(card, [11.7, .29, .17], [0, 3.44, 3.23]);
  for (const x of [-4.2, -.9, 2.3]) {
    block(timber, [2.1, .14, .95], [x, 1.24, .42]);
    for (const dx of [-.83, .83]) block(cedar, [.12, .72, .66], [x + dx, .86, .42]);
    for (const z of [-.56, 1.43]) {
      block(seats, [1.7, .14, .38], [x, .88, z]);
      for (const dx of [-.66, .66]) block(cedar, [.12, .33, .27], [x + dx, .67, z]);
    }
  }
  for (const y of [.58, 1.04, 1.5, 1.96, 2.42]) block(cedar, [3.2, .075, .55], [-3.9, y, -2.85]);
  for (const x of [-5.5, -2.3]) block(cedar, [.09, 1.94, .54], [x, 1.5, -2.85]);
  for (let index = 0; index < 11; index++) {
    const surfaces = [moss, seats, card];
    block(surfaces[index % surfaces.length], [.14, .23 + (index % 3) * .05, .26], [-5.29 + index * .2, 1.7, -2.84]);
  }
  for (let index = 0; index < 3; index++) {
    block(timber, [4, .1, .32], [.1, .45 - index * .11, 3.78 + index * .32]);
  }
  for (const x of [-6.75, 6.75]) {
    const trunk = new Three.Mesh(new Three.CylinderGeometry(.067, .1, 1.55, 8), cedar);
    trunk.position.set(x, .84, -2.8);
    const crown = new Three.Mesh(new Three.IcosahedronGeometry(.82, 1), moss);
    crown.castShadow = true;
    crown.scale.y = 1.25;
    crown.position.set(x, 1.95, -2.8);
    model.add(trunk, crown);
  }
  addBlock(roof, timber, [13, .2, 8.65], [0, -.1, 0]);
  for (let index = 0; index < 11; index++) {
    addBlock(roof, roofTile, [1.12, .085, 8.5], [-5.9 + index * 1.18, .04, 0]);
  }
  roof.rotation.x = -.051;
  roof.position.y = 3.87;
  model.add(roof);
  viewer.replace(model, { size: 8.4, center: 1.5 });
  return roof;
}

export function coordinationNotes(issue) {
  return [
    {
      title: 'Plan revision',
      evidence: [
        { sheet: 'A00', label: 'Index entry', value: issue.indexRevision },
        { sheet: 'A10', label: 'Plan title block', value: issue.planRevision },
      ],
      matches: issue.indexRevision === issue.planRevision,
      detail: 'Compare the index entry with the revision printed on the floor plan.',
    },
    {
      title: 'Detail reference',
      evidence: [
        { sheet: 'A20', label: 'Section callout', value: issue.detailCallout },
        { sheet: 'A30', label: 'Eave detail', value: eaveDetail },
      ],
      matches: issue.detailCallout === eaveDetail,
      detail: 'Follow the section callout to its detail and compare the sheet numbers.',
    },
    {
      title: 'Canopy label',
      evidence: [
        { sheet: 'A10', label: 'Plan label', value: issue.planCanopy },
        { sheet: 'A20', label: 'Section label', value: sectionCanopy },
      ],
      matches: issue.planCanopy === sectionCanopy,
      detail: 'The plan and section show the same canopy. Check whether they use the same name.',
    },
  ];
}

const sheetContent = {
  A00: (issue, target) => `
    <table>
      <thead><tr><th scope="col">Sheet</th><th scope="col">Drawing</th><th scope="col">Listed revision</th></tr></thead>
      <tbody>
        <tr class="${target('Index entry')}"><td>A10</td><td>Floor plan</td><td>${issue.indexRevision}</td></tr>
        <tr><td>A20</td><td>Section</td><td>A</td></tr>
        <tr><td>A30</td><td>Eave detail</td><td>A</td></tr>
      </tbody>
    </table>`,
  A10: (issue, target) => `
    <div class="draft-drawing plan-sheet ${target('Plan label')}">${drawPlan(pavilionPlan(issue), { selectable: true })}</div>
    <p class="plan-hint">Pick a numbered room to see it in the 3D model.</p>
    <div class="sheet-tags">
      <span class="${target('Plan label')}">Canopy: ${issue.planCanopy}</span>
      <span class="${target('Plan title block')}">Revision ${issue.planRevision}</span>
    </div>`,
  A20: (issue, target) => `
    <div class="draft-drawing section-drawing" role="img" aria-label="Schematic section with a sloping roof and an exterior canopy">
      <div class="section-frame" aria-hidden="true"><span class="sloped-roof"></span><span class="section-canopy ${target('Section label')}">${sectionCanopy}</span></div>
    </div>
    <div class="sheet-tags">
      <span class="${target('Section label')}">Canopy: ${sectionCanopy}</span>
      <span class="${target('Section callout')}">Detail ${issue.detailCallout}</span>
    </div>`,
  A30: (_issue, target) => `
    <div class="draft-drawing detail-drawing" role="img" aria-label="Schematic detail with an angled roof edge and a support post">
      <div class="detail-frame" aria-hidden="true"><span class="detail-post"></span><span class="detail-roof"></span></div>
    </div>
    <div class="sheet-tags"><span class="${target('Eave detail')}">Detail ${eaveDetail}</span></div>`,
};

function initDesk(page) {
  const issueButtons = [...page.querySelectorAll('[data-issue]')];
  const sheetButtons = [...page.querySelectorAll('[data-sheet]')];
  const noteList = page.querySelector('#note-list');
  const evidenceLinks = page.querySelector('#evidence-links');
  let issueKey = 'draft';
  let sheetKey = 'model';
  let noteIndex = 0;
  const modelPanel = page.querySelector('#pavilion-model');
  const modelActions = modelPanel.querySelectorAll('[data-model-action]');
  const modelHint = page.querySelector('#model-hint');
  const onError = () => {
    modelHint.textContent = '3D rendering is unavailable in this browser. You can still inspect the drawings.';
    for (const button of modelActions) button.disabled = true;
    modelPanel.classList.add('no-3d');
  };
  const viewer = createModelViewer(modelPanel.querySelector('.model-stage'), {
    onError,
    purpose: 'A fictional timber reading pavilion. Turn it, lift the roof, and check it against the drawings.',
    tips: ['Drag to turn, scroll or pinch to zoom', 'Tap a numbered point for a guided look', 'Hide roof shows the interior', 'Keys: arrows turn, + and − zoom, 0 resets'],
    storageKey: 'barchinet.hint.drawingdesk',
    schematic: 'Schematic model built from boxes; fictional project',
  });
  if (viewer) {
    const roof = makePavilion(viewer);
    modelPanel.classList.add('ready');
    viewer.setHotspots([
      { label: 'Roof and eaves', position: [0, 3.9, 0], text: 'The roof plane and the two long beams that carry it. Hide the roof to see the room below.', view: { azimuth: .5, elevation: .5, distance: 1 } },
      { label: 'Reading tables', position: [-.9, 1.5, .42], text: 'Three tables with benches on both sides, set along the long axis.', view: { target: [-.9, 1.1, .4], azimuth: .25, elevation: .42, distance: .7 } },
      { label: 'Book wall', position: [-3.9, 2.6, -2.85], text: 'Five shelves between two uprights on the north side.', view: { target: [-3.9, 1.5, -2.6], azimuth: .15, elevation: .2, distance: .6 } },
      { label: 'Entry steps', position: [.1, .7, 4.1], text: 'Three timber steps lead up to the deck on the south side.', view: { target: [.1, .5, 3.6], azimuth: .55, elevation: .22, distance: .65 } },
    ]);
    const actions = {
      roof: button => {
        roof.visible = !roof.visible;
        button.setAttribute('aria-pressed', String(!roof.visible));
        viewer.refreshLighting();
      },
      top: viewer.top,
      out: () => viewer.zoom(1 / 1.22),
      in: () => viewer.zoom(1.22),
      fit: viewer.fitView,
    };
    for (const button of modelActions) button.addEventListener('click', () => actions[button.dataset.modelAction](button));
  }

  const planViews = { alcove: 2, reading: 1 }; // room id -> hotspot index in the model
  bindPlan(page.querySelector('#sheet-content'), id => {
    if (!viewer || !(id in planViews)) return;
    openSheet('model');
    viewer.selectHotspot(planViews[id]);
    modelPanel.querySelector('canvas').focus({ preventScroll: true });
  });

  function openSheet(key, focus = false) {
    sheetKey = key;
    renderSheet();
    if (focus) sheetButtons.find(button => button.dataset.sheet === key).focus();
  }

  function renderSheet() {
    const issue = issues[issueKey];
    const note = coordinationNotes(issue)[noteIndex];
    const target = label => note.evidence.some(item => item.sheet === sheetKey && item.label === label) ? 'marked' : '';
    for (const button of sheetButtons) button.setAttribute('aria-pressed', String(button.dataset.sheet === sheetKey));
    modelPanel.hidden = sheetKey !== 'model';
    page.querySelector('.paper').hidden = sheetKey === 'model';
    if (sheetKey === 'model') return;
    page.querySelector('#sheet-id').textContent = sheetKey;
    page.querySelector('#sheet-heading').textContent = sheets[sheetKey].title;
    page.querySelector('#sheet-content').innerHTML = sheetContent[sheetKey](issue, target);
  }

  function renderIssue() {
    const issue = issues[issueKey];
    const notes = coordinationNotes(issue);
    const note = notes[noteIndex];
    const count = notes.filter(item => !item.matches).length;
    for (const button of issueButtons) button.setAttribute('aria-pressed', String(button.dataset.issue === issueKey));
    page.querySelector('#issue-summary').textContent = `${count} discrepancies in Issue ${issue.number}`;
    const noteButtons = noteList.querySelectorAll('button');
    notes.forEach((item, i) => {
      noteButtons[i].setAttribute('aria-pressed', String(i === noteIndex));
      noteButtons[i].querySelector('.note-status').textContent = item.matches ? 'Matches' : 'Mismatch';
      noteButtons[i].querySelector('.note-status').classList.toggle('match', item.matches);
    });
    page.querySelector('#evidence-title').textContent = note.title;
    page.querySelector('#evidence-detail').textContent = note.detail;
    evidenceLinks.replaceChildren(...note.evidence.map(item => {
      const button = page.createElement('button');
      const label = page.createElement('span');
      const value = page.createElement('strong');
      button.type = 'button';
      label.textContent = `${item.sheet} · ${item.label}`;
      value.textContent = item.value;
      button.append(label, value);
      button.addEventListener('click', () => {
        openSheet(item.sheet, true);
        page.querySelector('.sheets').scrollIntoView({ block: 'nearest' });
      });
      return button;
    }));
    renderSheet();
  }

  for (const button of issueButtons) {
    button.addEventListener('click', () => {
      issueKey = button.dataset.issue;
      renderIssue();
    });
  }
  for (const button of sheetButtons) {
    button.addEventListener('click', () => openSheet(button.dataset.sheet));
  }
  for (const [index, note] of coordinationNotes(issues.draft).entries()) {
    const button = page.createElement('button');
    const title = page.createElement('span');
    const status = page.createElement('small');
    button.type = 'button';
    title.textContent = note.title;
    status.className = 'note-status';
    button.append(title, status);
    button.addEventListener('click', () => {
      noteIndex = index;
      sheetKey = note.evidence[0].sheet;
      renderIssue();
    });
    noteList.append(button);
  }
  renderIssue();
}

if (globalThis.document) initDesk(document);
