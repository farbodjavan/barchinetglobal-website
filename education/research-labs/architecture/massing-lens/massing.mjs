import { Three, addBlock, createModelViewer, materials } from '../../assets/model-viewer.mjs?v=2';

export const yazd = { area: 250, floors: 3, height: 3, rotation: 0 };
const series = [
  { name: 'Elongated', ratio: 2.5, tones: ['#a9674a', '#ce956c', '#efd3ad'] },
  { name: 'Rectangular', ratio: 1.6, tones: ['#56745b', '#82a07c', '#c8d8b1'] },
  { name: 'Square', ratio: 1, tones: ['#55797b', '#7ca1a1', '#b4d2cb'] },
];
const steps = [
  ['Discover', 'Choose a design decision', 'Ask designers when they last compared building forms. Record the criteria, constraints and evidence they actually had.'],
  ['Prototype', 'Make a comparison reproducible', 'Keep floor area and height fixed while changing shape. Document the input assumptions and the result each user must interpret.'],
  ['Validate', 'Observe a real design task', 'Test whether a designer understands the comparison and can make the next decision. Record errors and revise the interaction.'],
  ['Energy study', 'Prepare the simulation inputs', 'Collect the site and weather, construction, windows, occupancy and systems. Use a documented physical model for energy results.'],
  ['Review', 'Show the exact version', 'Record what changed, the test inputs and what the reviewer should check. Send the saved study from Feature Lab.'],
];

export function calculate(options) {
  const { area, floors, height, rotation } = options;
  if (![area, floors, height, rotation].every(Number.isFinite) || area < 50 || area > 1000 ||
    !Number.isInteger(floors) || floors < 1 || floors > 10 || height < 2.5 || height > 5 || rotation < 0 || rotation > 180) return null;
  const totalHeight = height * floors;
  return {
    area, floors, height, rotation, totalHeight, gross: area * floors, volume: area * totalHeight,
    forms: series.map(({ name, ratio, tones }) => {
      const width = Math.sqrt(area / ratio);
      const depth = area / width;
      const perimeter = 2 * (width + depth);
      return { name, ratio, tones, width, depth, perimeter, wallArea: perimeter * totalHeight };
    }),
  };
}

const make = (type, value, className) => {
  const element = document.createElement(type);
  if (value) element.textContent = value;
  if (className) element.className = className;
  return element;
};
const format = new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format;
const rectangle = ({ width, depth }) => [[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]];

function drawSet(models, study, plan, renderFixed) {
  const angle = (study.rotation + (plan ? 0 : 34)) * Math.PI / 180;
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  const turn = ([x,y]) => [x * cosine - y * sine, x * sine + y * cosine];
  const project = (position, z) => {
    const [x,y] = turn(position);
    return plan ? [x, y] : [x, y * .42 - (z - study.totalHeight / 2) * .83];
  };
  const outlines = study.forms.map(rectangle);
  const bounds = outlines.flatMap((outline) => outline.flatMap((point) =>
    [project(point, 0), project(point, study.totalHeight)]));
  const scale = Math.min(240 / Math.max(1, ...bounds.map(([x]) => Math.abs(x))),
    115 / Math.max(1, ...bounds.map(([,y]) => Math.abs(y))));
  for (const [index, form] of study.forms.entries()) {
    if (renderFixed) {
      const context = models[index].canvas.getContext('2d');
      const { canvas } = context;
      const corners = outlines[index];
      const point = (location, height) => project(location, height).map((value, axis) => value * scale + [canvas.width/2, canvas.height/2][axis]);
      const line = (a, b, ink, width = 1) => {
        context.beginPath(); context.moveTo(...a); context.lineTo(...b);
        context.lineWidth = width; context.strokeStyle = ink; context.stroke();
      };
      const polygon = (points, fill) => {
        context.beginPath(); context.moveTo(...points[0]);
        for (const point of points.slice(1)) context.lineTo(...point);
        context.closePath(); context.fillStyle = fill; context.fill();
        context.lineWidth = 1.35; context.strokeStyle = '#28443b'; context.stroke();
      };
      const paper = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      paper.addColorStop(0, '#e8eddc'); paper.addColorStop(1, '#ccdace');
      context.fillStyle = paper; context.fillRect(0, 0, canvas.width, canvas.height);
      for (let x = 20; x <= canvas.width; x += 25) line([x,0],[x,canvas.height],'#4b755923');
      for (let y = 15; y <= canvas.height; y += 25) line([0,y],[canvas.width,y],'#4b755923');
      if (!plan) {
        const edges = corners.map((a, j) => {
          const b = corners[(j + 1) % corners.length];
          return { a, b, depth: (turn(a)[1] + turn(b)[1]) / 2, side: j % 2 };
        }).sort((a, b) => a.depth - b.depth);
        for (const { a,b,side } of edges) {
          polygon([point(a,0), point(b,0), point(b,study.totalHeight), point(a,study.totalHeight)], form.tones[side]);
          for (let level = 1; level < study.floors; level++) {
            line(point(a, level * study.height), point(b, level * study.height), '#203b327f');
          }
        }
      }
      polygon(corners.map((corner) => point(corner, study.totalHeight)), form.tones[2]);
      const length = [4, 2, 1].find((value) => value * scale < canvas.width / 3) || 1;
      const baseline = canvas.height - 17;
      line([20, baseline], [20 + length * scale, baseline], '#28443b', 2);
      context.fillStyle = '#28443b'; context.font = '600 12px system-ui';
      context.fillText(length + ' m', 20, baseline - 6);
    }
    models[index].canvas.setAttribute('aria-label', form.name + ' ' + (plan ? 'plan' : 'axonometric view') + ', ' +
      format(form.width) + ' by ' + format(form.depth) + ' meters, ' + format(study.totalHeight) + ' meters high');
    const measurements = [
      ['Dimensions', format(form.width) + ' × ' + format(form.depth) + ' m'],
      ['Perimeter', format(form.perimeter) + ' m'],
      ['Gross wall area', format(form.wallArea) + ' m²'],
    ];
    models[index].detail.replaceChildren(...measurements.map(([term, value]) => {
      const row = make('div');
      row.append(make('dt',term), make('dd',value));
      return row;
    }));
  }
}

function renderMassing(viewer, study, separated) {
  const group = new Three.Group();
  const spacing = Math.max(...study.forms.map(form => Math.hypot(form.width, form.depth))) * 1.11;
  const gap = separated ? study.height * .31 : 0;
  const visualHeight = study.totalHeight + (study.floors - 1) * gap;
  study.forms.forEach((form, index) => {
    const material = materials.plaster(form.tones[1]);
    const edge = materials.concrete(form.tones[0]);
    const floorTop = materials.concrete(form.tones[2]);
    const stack = new Three.Group();
    stack.rotation.y = Three.MathUtils.degToRad(study.rotation);
    stack.position.x = (index - 1) * spacing;
    const trim = study.height * .055;
    for (let level = 0; level < study.floors; level++) {
      const base = level * (study.height + gap);
      addBlock(stack, material, [form.width, study.height - trim, form.depth], [0, base + (study.height - trim) / 2, 0]);
      addBlock(stack, separated || level === study.floors - 1 ? floorTop : edge,
        [form.width * 1.012, trim, form.depth * 1.012], [0, base + study.height - trim / 2, 0]);
    }
    const figure = new Three.Mesh(new Three.CapsuleGeometry(.22, 1.26, 4, 10), materials.paint('#2f3b3a'));
    figure.position.set((index - 1) * spacing + form.width / 2 + 1.2, .85, form.depth / 2 + 1.2);
    figure.castShadow = true;
    group.add(stack, figure);
  });
  const hotspots = study.forms.map((form, index) => ({
    label: form.name,
    position: [(index - 1) * spacing, visualHeight + study.height * .25, 0],
    text: `${form.name}: ${format(form.width)} × ${format(form.depth)} m footprint, ${format(form.perimeter)} m perimeter. Same floor area and height as the other two.`,
    view: { target: [(index - 1) * spacing, visualHeight * .45, 0], azimuth: Math.PI * .2, elevation: Math.PI * .13, distance: .62 },
  }));
  viewer.replace(group, { size: Math.hypot(spacing * 1.51, visualHeight / 2), center: visualHeight * .43, hotspots });
}

function init() {
  const form = document.querySelector('.inputs');
  const fields = ['area','floors','height','rotation'];
  const output = document.querySelector('#totals');
  const error = document.querySelector('#form-error');
  const angle = document.querySelector('#angle');
  const exportButton = document.querySelector('#export');
  const orbitPanel = document.querySelector('#orbit-panel');
  const fallback = document.querySelector('#orbit-fallback');
  const modelList = document.querySelector('#models');
  let view = 'axon';
  let study;
  let displayedStudy;
  let separated = false;
  let orbitAvailable = true;
  let viewer;
  const models = series.map(({ name, ratio, tones }) => {
    const card = make('article', '', 'model');
    const canvas = make('canvas');
    canvas.width = 560;
    canvas.height = 300;
    canvas.setAttribute('role', 'img');
    const caption = make('div', '', 'model-copy');
    const heading = make('header');
    const swatch = make('span', '', 'model-swatch');
    swatch.style.backgroundColor = tones[1];
    swatch.setAttribute('aria-hidden', 'true');
    const title = make('h3', name);
    title.prepend(swatch);
    heading.append(title, make('span', ratio + ':1', 'model-ratio'));
    const detail = make('dl');
    caption.append(heading, detail);
    card.append(canvas, caption);
    modelList.append(card);
    return { canvas, detail };
  });
  function update() {
    angle.value = form.elements.rotation.value + '°';
    study = calculate(Object.fromEntries(fields.map((name) => [name, form.elements[name].valueAsNumber])));
    exportButton.disabled = !study;
    error.hidden = Boolean(study);
    if (!study) { error.textContent = 'Use 50–1,000 m², 1–10 whole floors, and 2.5–5 m floor height. The views show the last valid inputs.'; return; }
    displayedStudy = study;
    output.replaceChildren(...[[format(study.gross),'m² gross floor area'], [format(study.totalHeight),'m total height'],
      [format(study.volume),'m³ volume']].map(([value,label]) => make('span', value + ' ' + label)));
    renderResults();
  }
  function renderResults() {
    if (!displayedStudy) return;
    const showOrbit = view === 'axon' && orbitAvailable && Boolean(viewer);
    fallback.hidden = view === 'plan' || orbitAvailable;
    orbitPanel.hidden = !showOrbit;
    modelList.classList.toggle('is-3d', showOrbit);
    drawSet(models, displayedStudy, view === 'plan', !showOrbit);
    if (showOrbit) renderMassing(viewer, displayedStudy, separated);
  }
  orbitPanel.hidden = false;
  viewer = createModelViewer(orbitPanel.querySelector('.orbit-stage'), {
    enablePan: true,
    grid: true,
    purpose: 'Three forms with the same floor area and height. Turn them to compare how shape changes the outside wall.',
    tips: ['Drag to turn, scroll or pinch to zoom', 'Tap a numbered point to fly to one form', 'Change the light with the time-of-day switch', 'Keys: arrows turn, + and − zoom, 0 resets'],
    storageKey: 'barchinet.hint.massing',
    schematic: 'Schematic massing blocks, not designed buildings',
    onError: () => {
      orbitAvailable = false;
      renderResults();
    },
  });
  const actions = {
    explode: button => {
      separated = !separated;
      button.setAttribute('aria-pressed', String(separated));
      document.querySelector('#orbit-note').hidden = !separated;
      renderResults();
    },
    out: () => viewer.zoom(1 / 1.23),
    in: () => viewer.zoom(1.23),
    fit: () => viewer.fitView(),
  };
  for (const button of orbitPanel.querySelectorAll('[data-orbit]')) {
    button.addEventListener('click', () => actions[button.dataset.orbit](button));
  }
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('reset', () => requestAnimationFrame(update));
  for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click', () => {
    view = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    renderResults();
  });
  exportButton.addEventListener('click', () => {
    if (!study) return;
    const precision = (number) => number.toFixed(3);
    const csv = [
      'Form,Ratio,Floor area (m2),Floors,Floor height (m),Width (m),Depth (m),Perimeter (m),Gross wall area (m2),Total floor area (m2),Volume (m3)',
      ...study.forms.map((form) => [form.name, form.ratio, study.area, study.floors, study.height, precision(form.width), precision(form.depth),
        precision(form.perimeter), precision(form.wallArea), study.gross, study.volume].join(',')),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = make('a');
    link.href = url;
    link.download = 'massing-lens-comparison.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });
  const research = document.querySelector('#research-detail');
  const stepButtons = steps.map(([label], index) => {
    const button = make('button', label, 'button');
    button.type = 'button';
    button.addEventListener('click', () => showStep(index));
    return button;
  });
  function showStep(index) {
    stepButtons.forEach((button, step) => button.setAttribute('aria-pressed', String(index === step)));
    const [, heading, note] = steps[index];
    research.replaceChildren(make('h3', heading), make('p', note));
  }
  document.querySelector('#research-steps').append(...stepButtons);
  showStep(0);
  const notes = document.querySelector('#notes');
  const status = document.querySelector('#note-status');
  const key = 'barchinet-massing-lens-notes';
  try { notes.value = (localStorage.getItem(key) || '').slice(0, 2000); }
  catch { status.textContent = 'Browser storage is unavailable.'; }
  notes.addEventListener('input', () => {
    try { localStorage.setItem(key, notes.value); status.textContent = 'Notes saved in this browser.'; }
    catch { status.textContent = 'Browser storage is unavailable.'; }
  });
  update();
}

if (typeof document !== 'undefined') init();
