// Research Labs hub: an explorer rather than a list of links.
// - "Try a decision": one real control per reconstruction lab, run on the same model as the full lab.
// - "Find a prototype": every app in one filterable, searchable index (state kept in the URL hash).
// All text describes what the apps already do; data is the labs' synthetic training data.

const BASE = '/education/research-labs/';
const A = BASE + 'assets/';
const ARCH = BASE + 'architecture/';
const RURAL = BASE + 'rural-architecture/';
const FIELD = BASE + 'post-disaster-reconstruction/';

export const fields = [
  { id: 'reconstruction', label: 'Post-disaster reconstruction', short: 'Reconstruction', href: FIELD },
  { id: 'architecture', label: 'Architecture', short: 'Architecture', href: ARCH },
  { id: 'rural', label: 'Rural architecture', short: 'Rural', href: RURAL },
];
export const kinds = [
  { id: 'scenario', label: 'Scenario model', hint: 'Change inputs, read calculated results' },
  { id: '3d', label: '3D studio', hint: 'Orbit and edit a model' },
  { id: 'study', label: 'Visual study', hint: 'Read drawings and prepared notes' },
  { id: 'atlas', label: 'Evidence atlas', hint: 'Trace observations to their records' },
];

export const catalog = [
  { id: 'circularbuild', field: 'reconstruction', kind: 'scenario', title: 'CircularBuild', href: FIELD + 'circularbuild/', image: A + 'circular', question: 'Can you reduce landfill without losing sight of cost?', change: 'Floor area, share removed, on-site sorting, haul distance', get: 'Net cost, material recovered, landfill diversion, carbon proxy' },
  { id: 'panelbuild', field: 'reconstruction', kind: 'scenario', title: 'PanelBuild', href: FIELD + 'panelbuild/', image: A + 'panel', question: 'How does the construction strategy change time, cost and emissions?', change: 'Strategy, homes in programme, site crews, supplier distance', get: 'Programme duration and cost, days saved, production + haul proxy' },
  { id: 'vernacular', field: 'reconstruction', kind: 'scenario', title: 'Vernacular Futures', href: FIELD + 'vernacular/', image: A + 'vernacular', question: 'How do local materials shape cost and impact over decades?', change: 'Wall system, illustrative climate, study period, haul distance', get: 'Whole-life cost, energy proxy, environmental proxy, local spending' },
  { id: 'reliefroute', field: 'reconstruction', kind: 'scenario', title: 'ReliefRoute', href: FIELD + 'reliefroute/', image: A + 'relief', question: 'A road closes. Which constraints become binding?', change: 'Vehicles, demand, the northern bridge, shift length', get: 'Demand served, unmet kits, road distance, last return' },
  { id: 'shelterspace', field: 'reconstruction', kind: 'scenario', title: 'ShelterSpace', href: FIELD + 'shelterspace/', image: A + 'shelter', question: 'Who is assigned a place, and who is left out?', change: 'People needing shelter, active arenas, space per person, allocation order', get: 'People assigned, unmet need, average and farthest trip' },
  { id: 'sketch-story', field: 'architecture', kind: 'study', title: 'Sketch Story', href: ARCH + 'sketch-story/', image: A + 'architecture/sketch-01', question: 'Follow a design question through three studies.', change: 'Step through studies, open observations, compare two side by side', get: 'The decision behind each study and the question it leaves open' },
  { id: 'project-sketchbook', field: 'architecture', kind: 'study', title: 'Project Sketchbook', href: ARCH + 'project-sketchbook/', image: A + 'architecture/sketch-02', question: 'Read the project as a considered visual record.', change: 'Browse six chapters as book spreads', get: 'A printable record with questions to carry forward' },
  { id: 'sketch-community', field: 'architecture', kind: 'study', title: 'Sketch Perspectives', href: ARCH + 'sketch-community/', image: A + 'architecture/sketch-03', question: 'See how different readings sharpen a question.', change: 'Follow prepared studio exchanges step by step', get: 'Contrasting readings of one drawing, from fictional participants' },
  { id: 'curtainlab', field: 'architecture', kind: '3d', title: 'CurtainLab', href: ARCH + 'curtainlab/', image: A + 'curtainlab/concept', question: 'Change the façade grid. What follows from it?', change: 'Façade width and height, vertical bays, horizontal rows', get: 'Grid cell geometry, a 3D façade you can turn, A / B comparison' },
  { id: 'envelope-studio', field: 'architecture', kind: '3d', title: 'Noor Studio · Building Envelope Lab', href: ARCH + 'envelope-studio/start/', image: ARCH + 'envelope-studio/preview', question: 'How does each layer change a wall, roof or floor?', change: 'Layers of an assembly, one at a time', get: 'R and U values against cited benchmarks, an exportable report', note: 'Large 3D walkthrough · about 11 MB' },
  { id: 'massing-lens', field: 'architecture', kind: '3d', title: 'Massing Lens', href: ARCH + 'massing-lens/', image: ARCH + 'massing-lens/massing-models', question: 'How does shape change when floor area and height stay the same?', change: 'Floor area, floors, floor height, footprint rotation', get: 'Three forms in plan and a shared 3D view, an exportable comparison' },
  { id: 'drawing-desk', field: 'architecture', kind: '3d', title: 'Drawing Desk', href: ARCH + 'drawing-desk/', image: ARCH + 'drawing-desk/pavilion-study', question: 'When a drawing changes, what else needs to change with it?', change: 'Orbit the pavilion, open coordination notes, switch issues', get: 'Exactly what changed between two issues of a drawing set' },
  { id: 'daylight-studio', field: 'architecture', kind: '3d', title: 'Daylight Studio', href: ARCH + 'daylight-studio/', image: ARCH + 'daylight-studio/cover', question: 'Where does daylight land at four times of day?', change: 'Time of day, roof on or off, the room you pick on the plan', get: 'Sun and shadow in a courtyard studio, with a scale plan linked to the 3D view', note: 'Stand-in model until the baked model is installed' },
  { id: 'village-atlas', field: 'rural', kind: 'atlas', title: 'Village Atlas', href: RURAL + 'village-atlas/', image: A + 'rural-architecture/cheshmeh-sar', question: 'Locate a pattern. Inspect its record.', change: 'Choose a fictional village and a component', get: 'Thirty synthetic observations, each with its source record' },
  { id: 'village-comparison', field: 'rural', kind: 'atlas', title: 'Village Comparison', href: RURAL + 'village-comparison/', image: A + 'rural-architecture/aftab-dasht', question: 'Read differences without declaring a winner.', change: 'Choose villages and an architectural component', get: 'Side-by-side evidence across six components' },
  { id: 'design-guide', field: 'rural', kind: 'atlas', title: 'Design Guide', href: RURAL + 'design-guide/', image: A + 'rural-architecture/meh-darreh', question: 'Keep the reason beside the suggestion.', change: 'Choose a village and a project type', get: 'A teaching report with explicit rules and observation IDs' },
];

export function filterCatalog(items, { field = 'all', kind = 'all', q = '' } = {}) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => (field === 'all' || item.field === field) && (kind === 'all' || item.kind === kind) &&
    words.every(word => [item.title, item.question, item.change, item.get].join(' ').toLowerCase().includes(word)));
}

export function readHash(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const field = params.get('field'), kind = params.get('kind');
  return {
    field: fields.some(f => f.id === field) ? field : 'all',
    kind: kinds.some(k => k.id === kind) ? kind : 'all',
    q: (params.get('q') || '').slice(0, 60),
  };
}

export function renderHub(app, h) {
  const { esc, num, icon, brand, footer, labs, simulate, names, workedExamples } = h;
  const fieldOf = Object.fromEntries(fields.map(f => [f.id, f]));
  const kindOf = Object.fromEntries(kinds.map(k => [k.id, k]));
  let filters = readHash(location.hash);
  let sampleId = 'reliefroute', sampleValue;

  document.title = 'Research Labs — Barchinet Global Education';
  app.innerHTML = `<div class="container"><header class="site-head">${brand()}<nav class="nav" aria-label="Research Labs navigation"><a href="#try">Try a decision</a><a href="#explore">Find a prototype</a><a href="#approach">The approach</a></nav></header><main id="main">
<section class="hx-hero"><div><div class="eyebrow"><span class="dot"></span> Education / Research Labs</div><h1>Research,<br>made <em>useful.</em></h1><p>A place to see what research can become. Change one decision below, or find a working prototype by field, by what you do in it, or by keyword.</p><div class="hx-hero-actions"><a class="button primary" href="#try">Try a decision ${icon('arrow')}</a><a class="button" href="#explore">Find a prototype</a></div><p class="hx-count">${catalog.length} prototypes · ${fields.length} research fields · synthetic sample data</p></div>
<a class="hx-hero-art" href="#try" aria-label="Try a decision from ReliefRoute"><img src="${A}relief.webp" alt="Architectural model of a fictional city, river, bridges and recovery hubs" width="1672" height="941" fetchpriority="high"><span class="art-label"><span class="dot"></span> RESEARCH → MODEL → PRODUCT</span></a></section>

<section id="try" class="hx-try" aria-labelledby="try-title"><div class="section-head"><div><div class="eyebrow" style="margin-bottom:11px">01 — Try a decision</div><h2 id="try-title">Change one thing. Read what moves.</h2></div><p>Each sample runs the same simplified model as its full lab.<br>Pick a lab, then move its one control.</p></div>
<div class="hx-sampler"><div class="hx-tabs" role="tablist" aria-label="Choose a lab to sample">${labs.map(l => `<button role="tab" id="sample-tab-${l.id}" aria-controls="sample-panel" data-sample="${l.id}">${esc(names[l.id])}</button>`).join('')}</div><div class="hx-panel" id="sample-panel" role="tabpanel"></div></div></section>

<section id="explore" class="hx-explore" aria-labelledby="explore-title"><div class="section-head"><div><div class="eyebrow" style="margin-bottom:11px">02 — Find a prototype</div><h2 id="explore-title">Every working prototype. One index.</h2></div><p>Filter by research field or by what you do in the app.<br>Every card says what you change and what you get.</p></div>
<form class="hx-filters" id="hx-filters" role="search" aria-label="Filter prototypes"><label class="hx-search"><span>Search</span><input type="search" id="hx-q" placeholder="façade, shelter, courtyard…" autocomplete="off" maxlength="60"></label>
<fieldset><legend>Research field</legend><div class="hx-chips" id="hx-fields"></div></fieldset><fieldset><legend>What you do</legend><div class="hx-chips" id="hx-kinds"></div></fieldset></form>
<p class="hx-status" id="hx-status" role="status" aria-live="polite"></p><div class="hx-grid" id="hx-grid"></div>
<div class="hx-empty" id="hx-empty" hidden><h3>No prototype matches those filters.</h3><p>Try a broader word, or clear the filters to see all ${catalog.length}.</p><button class="button" type="button" id="hx-clear">Clear filters</button></div></section>

<section id="fields" class="hx-collections" aria-labelledby="fields-title"><div class="section-head"><div><div class="eyebrow" style="margin-bottom:11px">03 — Browse a whole collection</div><h2 id="fields-title">Different questions. Useful tools.</h2></div><p>Each field has its own collection.<br>Every application starts with a decision someone needs to make.</p></div>
<div class="hx-collection-row">${fields.map((f, i) => { const count = catalog.filter(c => c.field === f.id).length; const cover = [A + 'shelter-800.webp', A + 'architecture/sketch-01-800.webp', A + 'rural-architecture/cheshmeh-sar-800.webp'][i]; const copy = ['Material recovery, rapid housing, whole-life design, relief routes and temporary shelter.', 'Design studies, drawing coordination, massing, a parametric façade and layered assemblies.', 'Three fictional villages, their architectural elements and source-linked design prompts.'][i]; return `<a class="hx-collection" href="${f.href}"><img src="${cover}" alt="" width="800" height="533" loading="lazy" decoding="async"><div><span class="hx-tag">0${i + 1} · ${count} web apps</span><h3>${esc(f.label)}</h3><p>${copy}</p><span class="field-enter">Open the collection ${icon('arrow')}</span></div></a>`; }).join('')}</div></section>

<section id="approach" class="journey"><div class="eyebrow">04 — From a paper to a purpose</div><h2>A global product begins with<br>a useful decision.</h2><div class="journey-track"><div><span>01 / RESEARCH</span><h3>Ask a better question.</h3><p>Define the problem, the evidence and the limits of what you know.</p></div><div><span>02 / MODEL</span><h3>Make it testable.</h3><p>Turn relationships into inputs, constraints and transparent calculations.</p></div><div><span>03 / PRODUCT</span><h3>Design for someone.</h3><p>Give different users a clear task, useful feedback and an understandable result.</p></div><div><span>04 / GLOBAL USE</span><h3>Make it adaptable.</h3><p>Validate locally. Adapt languages, units, data, access and workflows.</p></div></div></section>
<section id="about" class="footnote"><div><div class="eyebrow" style="margin-bottom:13px">05 — A place for research to grow</div><h2>One platform.<br>Distinct research collections.</h2></div><p>Research Labs is the shared home for field-specific collections and independent applications. Current collections explore post-disaster reconstruction, architecture and rural architecture. These learning prototypes use synthetic data, transparent calculations and method references; developing a global product also requires user research, local evidence, validation and continuing maintenance.</p></section></main>${footer()}</div>`;

  /* ---------- Try a decision ---------- */
  const panel = app.querySelector('#sample-panel');
  const optionLabel = (control, value) => control.type === 'select'
    ? (control.options.find(o => String(o.value ?? o) === String(value))?.label ?? String(value))
    : `${num(Number(value))}${control.unit ? ' ' + control.unit : ''}`;

  function renderSample(focusControl) {
    const lab = labs.find(l => l.id === sampleId), recipe = workedExamples[sampleId];
    const control = lab.controls.find(c => c.key === recipe.key);
    if (sampleValue === undefined) sampleValue = recipe.to;
    for (const tab of app.querySelectorAll('[data-sample]')) { const on = tab.dataset.sample === sampleId; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; }
    panel.setAttribute('aria-labelledby', 'sample-tab-' + sampleId);
    let base, now;
    try {
      base = simulate(sampleId, { ...lab.defaults, [recipe.key]: recipe.from });
      now = simulate(sampleId, { ...lab.defaults, [recipe.key]: sampleValue });
    } catch (error) {
      console.error(error);
      panel.innerHTML = `<div class="hx-sample-error" role="alert"><h3>This sample could not be calculated.</h3><p>The full lab is still available.</p><a class="button primary" href="${FIELD}${sampleId}/">Open ${esc(names[sampleId])} Lab ${icon('arrow')}</a></div>`;
      return;
    }
    const input = control.type === 'select'
      ? `<div class="hx-seg" role="group" aria-label="${esc(control.label)}">${control.options.map(o => { const v = o.value ?? o; return `<button type="button" data-value="${esc(v)}" aria-pressed="${String(v) === String(sampleValue)}">${esc(o.label ?? o)}</button>`; }).join('')}</div>`
      : `<div class="hx-range"><input type="range" id="sample-range" min="${control.min}" max="${control.max}" step="${control.step || 1}" value="${sampleValue}" aria-label="${esc(control.label)}"><output for="sample-range">${esc(optionLabel(control, sampleValue))}</output></div>`;
    const same = String(sampleValue) === String(recipe.from);
    panel.innerHTML = `<div class="hx-sample-ask"><span class="hx-tag">${esc(names[sampleId])} Lab · synthetic scenario</span><h3>${esc(recipe.question)}</h3><p>${esc(lab.mission)}</p><div class="hx-control"><span class="hx-control-label">${esc(control.label)}</span>${input}<p class="hx-baseline">Starting point: <strong>${esc(optionLabel(control, recipe.from))}</strong>. Everything else stays at the lab’s defaults.</p></div></div>
<div class="hx-sample-out"><div class="hx-metrics" aria-live="polite">${now.metrics.map((metric, i) => { const before = base.metrics[i]?.value, moved = typeof before === 'number' && Math.abs(metric.value - before) > 1e-9; const delta = moved ? metric.value - before : 0; return `<div class="hx-metric${i === recipe.metric ? ' focus' : ''}"><span class="hx-metric-label">${esc(metric.label)}</span><strong>${num(metric.value)} <small>${esc(metric.unit || '')}</small></strong><span class="hx-delta ${moved ? 'moved' : ''}">${same ? 'Starting point' : moved ? `${delta > 0 ? '+' : '−'}${num(Math.abs(delta))} ${esc(metric.unit || '')} from ${num(before)}` : 'No change'}</span></div>`; }).join('')}</div>
<p class="hx-lesson">${esc(recipe.lesson)}</p><div class="hx-next"><a class="button primary" href="${FIELD}${sampleId}/">Open the full ${esc(names[sampleId])} Lab ${icon('arrow')}</a><span>All four inputs, the live diagram, a worked guide and references.</span></div></div>`;
    if (focusControl) panel.querySelector(focusControl)?.focus({ preventScroll: true });
    for (const button of panel.querySelectorAll('[data-value]')) button.onclick = () => { sampleValue = button.dataset.value; renderSample(`[data-value="${CSS.escape(button.dataset.value)}"]`); };
    const range = panel.querySelector('#sample-range');
    if (range) range.oninput = () => { sampleValue = Number(range.value); renderSample('#sample-range'); };
  }
  const tabs = [...app.querySelectorAll('[data-sample]')];
  for (const tab of tabs) tab.onclick = () => { sampleId = tab.dataset.sample; sampleValue = undefined; renderSample(); };
  app.querySelector('.hx-tabs').addEventListener('keydown', event => {
    const at = tabs.indexOf(document.activeElement); if (at < 0) return;
    const next = event.key === 'ArrowRight' ? (at + 1) % tabs.length : event.key === 'ArrowLeft' ? (at + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next < 0) return; event.preventDefault(); tabs[next].focus(); tabs[next].click();
  });
  renderSample();

  /* ---------- Find a prototype ---------- */
  const grid = app.querySelector('#hx-grid'), status = app.querySelector('#hx-status'), empty = app.querySelector('#hx-empty'), search = app.querySelector('#hx-q');
  const chip = (group, id, label, count, pressed) => `<button type="button" class="hx-chip" data-${group}="${id}" aria-pressed="${pressed}">${esc(label)} <span>${count}</span></button>`;
  function renderFilters() {
    const countFor = extra => filterCatalog(catalog, { ...filters, ...extra }).length;
    app.querySelector('#hx-fields').innerHTML = chip('field', 'all', 'All fields', countFor({ field: 'all' }), filters.field === 'all') + fields.map(f => chip('field', f.id, f.short, countFor({ field: f.id }), filters.field === f.id)).join('');
    app.querySelector('#hx-kinds').innerHTML = chip('kind', 'all', 'Anything', countFor({ kind: 'all' }), filters.kind === 'all') + kinds.map(k => chip('kind', k.id, k.label, countFor({ kind: k.id }), filters.kind === k.id)).join('');
  }
  function renderGrid({ keepFocus } = {}) {
    const items = filterCatalog(catalog, filters);
    grid.innerHTML = items.map(item => `<a class="hx-card" href="${item.href}"><div class="hx-card-image"><img src="${item.image}-800.webp" alt="" width="800" height="533" loading="lazy" decoding="async" onerror="this.closest('.hx-card-image').classList.add('missing');this.remove()"><span class="hx-kind">${esc(kindOf[item.kind].label)}</span></div><div class="hx-card-body"><span class="hx-tag">${esc(fieldOf[item.field].label)}</span><h3>${esc(item.title)}</h3><p class="hx-question">${esc(item.question)}</p><dl><div><dt>You change</dt><dd>${esc(item.change)}</dd></div><div><dt>You get</dt><dd>${esc(item.get)}</dd></div></dl>${item.note ? `<p class="hx-note">${esc(item.note)}</p>` : ''}<span class="hx-open">Open ${icon('arrow')}</span></div></a>`).join('');
    empty.hidden = items.length > 0; grid.hidden = items.length === 0;
    const active = filters.field !== 'all' || filters.kind !== 'all' || filters.q;
    status.textContent = items.length === catalog.length && !active ? `Showing all ${catalog.length} prototypes.` : `Showing ${items.length} of ${catalog.length} prototypes.`;
    const focused = keepFocus && document.activeElement?.closest('.hx-chip');
    const token = focused ? (focused.dataset.field ? `[data-field="${focused.dataset.field}"]` : `[data-kind="${focused.dataset.kind}"]`) : null;
    renderFilters();
    if (token) app.querySelector(token)?.focus({ preventScroll: true });
    const params = new URLSearchParams();
    if (filters.field !== 'all') params.set('field', filters.field);
    if (filters.kind !== 'all') params.set('kind', filters.kind);
    if (filters.q) params.set('q', filters.q);
    const next = params.toString();
    if (active || /^#(field|kind|q)=/.test(location.hash)) history.replaceState(null, '', next ? '#' + next : location.pathname + location.search);
  }
  app.querySelector('#hx-filters').addEventListener('click', event => {
    const button = event.target.closest('.hx-chip'); if (!button) return;
    if (button.dataset.field) filters.field = button.dataset.field; else filters.kind = button.dataset.kind;
    renderGrid({ keepFocus: true });
  });
  app.querySelector('#hx-filters').addEventListener('submit', event => event.preventDefault());
  search.value = filters.q;
  search.addEventListener('input', () => { filters.q = search.value.slice(0, 60); renderGrid(); });
  app.querySelector('#hx-clear').onclick = () => { filters = { field: 'all', kind: 'all', q: '' }; search.value = ''; renderGrid(); search.focus(); };
  addEventListener('hashchange', () => { if (/^#(field|kind|q)=/.test(location.hash)) { filters = readHash(location.hash); search.value = filters.q; renderGrid(); } });
  renderGrid();
  if (/^#(field|kind|q)=/.test(location.hash)) app.querySelector('#explore').scrollIntoView();
}
