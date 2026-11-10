import {archProjects, archReferencesByApp, archMaturityLevels, courtyardProject, archComparisonPair, archExchangeReadings, archPlaybackStep, archQuickStartByApp} from './architecture-data.mjs';

const base = '/education/research-labs/', field = base + 'architecture/', assets = base + 'assets/';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const id = (typeof location === 'undefined' ? '' : location.pathname).split('/').find(part => archProjects.some(project => project.id === part));
const project = archProjects.find(project => project.id === id), stages = archProjects[0].stages;
const art = stage => assets + 'architecture/' + stage.imageKey + '.png';
const titles = {'sketch-story':'Sketch Story', 'project-sketchbook':'Project Sketchbook', 'sketch-community':'Sketch Perspectives'};
const blurbs = {'sketch-story':'Follow a design question through three studies.', 'project-sketchbook':'Read the project as a considered visual record.', 'sketch-community':'See how different readings sharpen a question.'};
let selected = 0, pin = 0, phase = 0, role = 0, mode = 'drawing', compare = false, baseline;
let playing = false, timer, tourEnded = false, filmUnavailable = false, preparingPrint = false;
let notesVisible = true, viewObserver;
const view = {zoom: 1, x: 0, y: 0, signature: ''};

export function sketchViewGeometry(size, state = {}) {
  const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
  const finite = value => Number.isFinite(value) ? value : 0;
  const width = positive(size.width, 1), height = positive(size.height, 1);
  const boardWidth = positive(size.boardWidth, 1000), boardHeight = positive(size.boardHeight, 1000 / 1.5);
  const fit = Math.min(Math.max(1, width - 48) / boardWidth, Math.max(1, height - 48) / boardHeight);
  const zoom = Math.max(1, Math.min(4, positive(state.zoom, 1))), scale = fit * zoom;
  const limitX = Math.max(0, (boardWidth * scale - width) / 2 + 24), limitY = Math.max(0, (boardHeight * scale - height) / 2 + 24);
  return {width, height, boardWidth, boardHeight, fit, zoom, scale, limitX, limitY, x: limitX ? Math.max(-limitX, Math.min(limitX, finite(state.x))) : 0, y: limitY ? Math.max(-limitY, Math.min(limitY, finite(state.y))) : 0};
}

const logo = () => `<a class="identity" href="${base}"><img src="${assets}barchinet-global.svg" alt="Barchinet Global"><span>RESEARCH LABS</span></a>`;
const nav = () => `<nav class="app-nav" aria-label="Architecture apps">${archProjects.map((app, i) => `<a href="${field + app.id}/" ${id === app.id ? 'aria-current="page"' : ''}><span>0${i + 1}</span>${titles[app.id]}</a>`).join('')}<a href="${field}curtainlab/"><span>04</span>CurtainLab</a></nav>`;
const items = () => id === 'project-sketchbook' ? project.chapters : id === 'sketch-community' ? project.posts : stages;
const currentStage = () => id === 'sketch-story' ? stages[selected] : stages.find(stage => stage.id === items()[selected].stageId) || stages[0];
const references = () => archReferencesByApp[id] || [...new Map(Object.values(archReferencesByApp).flat().map(reference => [reference.url, reference])).values()];
const noun = () => id === 'project-sketchbook' ? 'chapter' : id === 'sketch-community' ? 'question' : 'study';

function header() {
  return `<header class="product-header">${logo()}<div class="breadcrumbs"><a href="${base}">Education</a><span>/</span><a href="${field}">Architecture</a>${project ? `<span>/</span><strong>${titles[id]}</strong>` : ''}</div><button class="plain" id="evidence">Research demo · Level 1</button></header>`;
}

function collection() {
  document.title = 'Architecture — Barchinet Global';
  $('#app').innerHTML = header() + `<main id="main" tabindex="-1" class="collection"><div class="collection-intro"><small>ARCHITECTURE / COLLECTION 02</small><h1>Turn architectural questions<br>into working tools.</h1><p>Four working applications: read a design study, follow a project record, explore prepared perspectives or test a parametric façade. Each has its own question, sources and research boundaries.</p></div><div class="collection-grid">${archProjects.map((app, i) => `<a class="collection-app" href="${field + app.id}/"><div class="collection-image"><img src="${art(stages[i])}" alt="Fictional courtyard design study"><span>0${i + 1}</span></div><div><small>INTERACTIVE STUDY</small><h2>${titles[app.id]} <span>↗</span></h2><p>${blurbs[app.id]}</p><footer>Open application <span>→</span></footer></div></a>`).join('')}<a class="collection-app" href="${field}curtainlab/"><div class="collection-image"><img src="${assets}curtainlab/concept.jpg" alt="AI-generated conceptual glass curtain-wall façade" loading="lazy"><span>04</span></div><div><small>PARAMETRIC DESIGN STUDIO</small><h2>CurtainLab <span>↗</span></h2><p>Change the façade grid. Inspect geometry. Compare alternatives with traceable sources.</p><footer>Open application <span>→</span></footer></div></a></div><div class="collection-foot"><p class="scope">English learning prototypes · Curated content · AI-generated concept illustrations · No visitor submissions</p><button class="plain" id="collection-sources">Sources & study boundaries ↗</button></div></main><dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
  bindEvidence();
  $('#collection-sources').onclick = showSources;
}

function quickStart() {
  return `<details class="quick-start" id="quick-start"><summary><strong>Quick start</strong><span>${archQuickStartByApp[id].map(step => esc(step.title)).join(' → ')}</span></summary><ol>${archQuickStartByApp[id].map((step, index) => `<li><span class="quick-number">0${index + 1}</span><div><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p><button class="plain" data-quick-step="${index}">${esc(step.label)} →</button></div></li>`).join('')}</ol><div class="quick-film"><p>Play readings steps through the notes; pause at any time. Process film opens a separate concept clip. Use its player controls, then return to ${id === 'project-sketchbook' ? 'Book spread' : 'Drawing'} to continue exploring.</p><button class="plain" id="quick-film">Open process film →</button></div></details>`;
}

function runQuickStart(index) {
  const step = archQuickStartByApp[id][index];
  $('#quick-start').open = false;
  if (step.action === 'print') { printBook(); return; }
  stop();
  selected = step.target.selected; pin = step.target.pin || 0; phase = step.target.phase || 0;
  compare = Boolean(step.target.compare); baseline = step.target.baseline;
  mode = 'drawing'; tourEnded = false; view.signature = '';
  render();
  const focus = step.focus === 'contents' ? $(`[data-index="${selected}"]`) : step.focus === 'comparison' ? $('#comparison-baseline') : step.focus === 'canvas' ? $('#canvas') : $('#reading');
  focus?.focus({preventScroll: true});
  focus?.scrollIntoView({block: 'nearest', behavior: 'auto'});
  if (id === 'sketch-community') $('.exchange .highlight')?.scrollIntoView({block: 'nearest', behavior: 'auto'});
}

function shell() {
  document.title = titles[id] + ' — Barchinet Global';
  $('#app').innerHTML = header() + nav() + `<main id="main" tabindex="-1" class="application"><section class="workspace-heading"><div><small>${id === 'sketch-story' ? 'DESIGN RECORD' : id === 'project-sketchbook' ? 'PROJECT ARCHIVE' : 'CURATED STUDIO EXCHANGE'}</small><h1>${titles[id]}</h1><p>${blurbs[id]}</p></div><div class="heading-actions"><label>Perspective <select id="perspective" aria-label="Viewing perspective">${project.roles.map((perspective, i) => `<option value="${i}">${esc(perspective.name)}</option>`).join('')}</select></label><button class="tool" id="sources">Sources ↗</button></div></section><div class="workbench"><aside class="index-panel" aria-label="Study contents"><div class="panel-heading">${id === 'project-sketchbook' ? 'CHAPTERS' : id === 'sketch-community' ? 'DESIGN QUESTIONS' : 'THREE STUDIES'}<span>${items().length}</span></div><div id="index"></div><div class="context-note"><strong>One shared case</strong><p>A courtyard between light and privacy.</p><button class="plain brief-link" id="brief">Read the project brief ↗</button></div></aside><section class="canvas-panel" aria-label="Study viewer"><div class="canvas-toolbar"><div class="segmented" role="tablist" aria-label="Viewing mode"><button role="tab" aria-selected="true" aria-controls="canvas" tabindex="0" id="drawing-tab">${id === 'project-sketchbook' ? 'Book spread' : 'Drawing'}</button><button role="tab" aria-selected="false" aria-controls="canvas" tabindex="-1" id="film-tab">Process film</button></div><div class="canvas-tools">${id === 'sketch-story' ? '<button class="tool" id="compare" aria-pressed="false">Compare studies</button>' : ''}${id === 'project-sketchbook' ? '<button class="tool" id="print">Print record</button>' : ''}<button class="tool" id="focus" aria-pressed="false">Focus view ⤢</button></div></div><div id="canvas" class="canvas" role="tabpanel" tabindex="0" aria-labelledby="drawing-tab"></div><div class="viewer-bottom"><div><button class="round" id="previous" aria-label="Previous ${noun()}">←</button><span id="position"></span><button class="round" id="next" aria-label="Next ${noun()}">→</button></div><button class="play-study" id="play" aria-pressed="false">▶ Guided playback</button></div><div class="caption-line" id="caption"></div><p class="visually-hidden" id="study-status" role="status" aria-live="polite" aria-atomic="true"></p></section><aside class="reading-panel" aria-label="Design reading"><div class="reading-top"><small id="reading-label"></small><span class="read-only">CURATED</span></div><div id="reading"></div><p class="role-prompt" id="role-prompt"></p></aside></div><footer class="application-footer"><span><a href="/">Barchinet Global</a> · Fictional case · AI concept illustrations · View-only · <a href="/website-privacy.html">Privacy</a></span><button class="plain" id="about">About the model & references ↗</button></footer></main><dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
  $('.workspace-heading').insertAdjacentHTML('afterend', quickStart());
  $('#canvas').insertAdjacentHTML('beforebegin', viewerControls());
  $('#zoom-in').onclick = () => changeZoom(view.zoom * 1.25);
  $('#zoom-out').onclick = () => changeZoom(view.zoom / 1.25);
  $('#zoom-fit').onclick = resetView;
  if ($('#notes-toggle')) $('#notes-toggle').onclick = () => { notesVisible = !notesVisible; render(); };
  if ($('#focus-observation')) $('#focus-observation').onclick = focusObservation;
  $('#reading').tabIndex = -1;
  document.querySelectorAll('[data-quick-step]').forEach(button => button.onclick = () => runQuickStart(Number(button.dataset.quickStep)));
  $('#quick-film').onclick = () => { $('#quick-start').open = false; setMode('film'); const player = $('#canvas video') || $('#return-to-drawing'); player?.focus({preventScroll: true}); $('#canvas').scrollIntoView({block: 'nearest', behavior: 'auto'}); };
  bindEvidence();
  $('#sources').onclick = $('#about').onclick = showSources;
  $('#brief').onclick = () => modal('The project question', `<p>${esc(courtyardProject.brief)}</p><p>${esc(courtyardProject.context)}</p><p>The three drawings are independent conceptual alternatives, not geometric revisions of a measured plan. All readings are prepared teaching material.</p>`);
  $('#perspective').onchange = event => { stop(); role = Number(event.target.value); render(); };
  for (const tab of ['drawing', 'film']) $('#' + tab + '-tab').onclick = () => setMode(tab);
  document.querySelector('.segmented').onkeydown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'drawing' : event.key === 'End' ? 'film' : mode === 'drawing' ? 'film' : 'drawing';
    setMode(next);
    $('#' + next + '-tab').focus();
  };
  $('#previous').onclick = () => choose(selected - 1);
  $('#next').onclick = () => choose(selected + 1);
  $('#play').onclick = togglePlayback;
  $('#focus').onclick = toggleFocus;
  if ($('#compare')) $('#compare').onclick = () => { stop(); compare = !compare; mode = 'drawing'; render(); };
  if ($('#print')) $('#print').onclick = printBook;
  render();
}

function stop() {
  playing = false;
  clearInterval(timer);
  timer = undefined;
  updatePlaybackButton();
  $('#canvas video')?.pause();
}

function updatePlaybackButton() {
  const button = $('#play');
  if (!button) return;
  button.hidden = mode === 'film';
  button.setAttribute('aria-pressed', String(playing));
  button.textContent = playing ? 'Ⅱ Pause readings' : tourEnded ? '↺ Replay readings' : '▶ Play readings';
  button.title = 'Step through the prepared readings automatically. Pause at any time; playback stops at the final reading.';
}

function togglePlayback() {
  if (playing) { stop(); return; }
  if (mode === 'film') return;
  if (tourEnded) { selected = 0; pin = 0; phase = 0; tourEnded = false; }
  compare = false;
  playing = true;
  render();
  timer = setInterval(() => {
    const next = archPlaybackStep(id, {selected, pin, phase});
    ({selected, pin, phase} = next);
    if (next.ended) { tourEnded = true; stop(); }
    render();
  }, 6500);
}

function setMode(next) { stop(); mode = next; if (next === 'film') view.signature = ''; render(); }

function choose(index) {
  stop();
  selected = Math.max(0, Math.min(items().length - 1, index));
  pin = 0; phase = 0; tourEnded = false; mode = 'drawing'; view.signature = '';
  render();
  $('.reading-panel').scrollTop = 0;
}

function toggleFocus() {
  const focused = $('.workbench').classList.toggle('focused');
  $('#focus').textContent = focused ? 'Exit focus ↙' : 'Focus view ⤢';
  $('#focus').setAttribute('aria-pressed', String(focused));
}

function focusToken() {
  const active = document.activeElement;
  if (active?.hasAttribute('data-index')) return `[data-index="${active.dataset.index}"]`;
  if (active?.hasAttribute('data-annotation')) return `[data-annotation="${active.dataset.annotation}"]`;
  if (active?.id === 'comparison-baseline') return '#comparison-baseline';
  if (active?.hasAttribute('data-reading')) return `[data-reading="${active.dataset.reading}"]`;
  return null;
}

function render() {
  const restore = focusToken(), all = items(), item = all[selected], stage = currentStage();
  $('#index').innerHTML = all.map((entry, index) => `<button class="index-item ${index === selected ? 'selected' : ''}" data-index="${index}" ${index === selected ? 'aria-current="step"' : ''}><span class="item-number">${String(index + 1).padStart(2, '0')}</span><div><strong>${esc(id === 'sketch-story' ? entry.title : String(entry.title).replace(/^\d+\s*·\s*/, ''))}</strong><small>${esc(id === 'sketch-story' ? entry.focus : id === 'project-sketchbook' ? entry.subtitle : entry.topic)}</small></div><span class="item-arrow">→</span></button>`).join('');
  document.querySelectorAll('[data-index]').forEach(button => button.onclick = () => choose(Number(button.dataset.index)));
  $('#position').textContent = mode === 'film' ? 'CONTEXT FILM' : String(selected + 1).padStart(2, '0') + ' / ' + String(all.length).padStart(2, '0');
  $('#previous').disabled = mode === 'film' || selected === 0;
  $('#next').disabled = mode === 'film' || selected === all.length - 1;
  for (const tab of ['drawing', 'film']) {
    $('#' + tab + '-tab').setAttribute('aria-selected', String(mode === tab));
    $('#' + tab + '-tab').tabIndex = mode === tab ? 0 : -1;
  }
  $('#canvas').setAttribute('aria-labelledby', mode + '-tab');
  $('#viewer-controls').hidden = mode === 'film';
  if ($('#notes-toggle')) {
    $('#notes-toggle').disabled = compare;
    $('#notes-toggle').setAttribute('aria-pressed', String(notesVisible));
    $('#notes-toggle').textContent = notesVisible ? 'Notes on' : 'Notes off';
    $('#focus-observation').disabled = compare;
    $('#focus-observation').textContent = `Focus observation ${pin + 1}`;
  }
  $('#role-prompt').textContent = project.roles[role].goal;
  if ($('#compare')) {
    $('#compare').setAttribute('aria-pressed', String(compare && mode === 'drawing'));
    $('#compare').textContent = compare && mode === 'drawing' ? 'Single study' : 'Compare studies';
  }
  renderCanvas(stage, item);
  renderReading(stage, item);
  $('#caption').textContent = mode === 'film' ? project.filmDescription : compare && id === 'sketch-story' ? 'Compare stated intentions across independent concept illustrations. Their visual differences are not measured geometric changes.' : id === 'sketch-story' ? stage.decision : id === 'project-sketchbook' ? item.subtitle : 'Curated exchange · ' + item.topic + ' · Fictional participants';
  $('#reading-label').textContent = id === 'sketch-story' ? 'DESIGN DECISION' : id === 'project-sketchbook' ? 'READING THE RECORD' : 'STUDIO READINGS';
  $('#study-status').textContent = mode === 'film' ? 'Concept film. Use the video player controls.' : `${titles[id]}, ${noun()} ${selected + 1} of ${all.length}${id === 'sketch-story' && !compare ? `, observation ${pin + 1} of ${stage.annotations.length}` : id === 'sketch-community' ? `, ${archExchangeReadings(item)[phase].label}` : ''}${tourEnded ? '. Reading playback complete.' : ''}`;
  updatePlaybackButton();
  if (restore) $(restore)?.focus({preventScroll: true});
}

function viewerControls() {
  return `<div class="viewer-controls" id="viewer-controls" role="group" aria-label="Canvas viewing tools"><div class="zoom-tools"><button class="view-tool" id="zoom-out" aria-label="Zoom out">−</button><output id="zoom-value" aria-label="Magnification relative to fit" aria-live="polite">100%</output><button class="view-tool" id="zoom-in" aria-label="Zoom in">+</button><button class="view-tool" id="zoom-fit" title="Fit the complete study in the viewer">Fit</button></div>${id === 'sketch-story' ? '<div class="layer-tools"><button class="view-tool" id="notes-toggle" aria-pressed="true">Notes on</button><button class="view-tool" id="focus-observation">Focus observation 1</button></div>' : ''}<span class="view-hint">Zoom, then drag to inspect</span><p id="viewer-help" class="visually-hidden">Use the zoom buttons on touch or keyboard. Focus the canvas and use plus or minus to zoom, arrow keys to pan when zoomed, and zero or Home to fit the whole study. Zoom changes the view only; it is not a measured drawing scale.</p></div>`;
}

function viewGeometry() {
  const viewport = $('#study-viewport'), surface = $('#zoom-surface');
  if (!viewport || !surface) return null;
  return sketchViewGeometry({width: viewport.clientWidth, height: viewport.clientHeight, boardWidth: surface.offsetWidth, boardHeight: surface.offsetHeight}, view);
}

function applyView() {
  const geometry = viewGeometry();
  if (!geometry) return;
  view.zoom = geometry.zoom; view.x = geometry.x; view.y = geometry.y;
  $('#zoom-surface').style.transform = `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${geometry.scale})`;
  $('#zoom-surface').style.setProperty('--pin-scale', String(1 / geometry.scale));
  $('#study-viewport').dataset.zoomed = String(view.zoom > 1);
  $('#zoom-value').textContent = `${Math.round(view.zoom * 100)}%`;
  $('#zoom-in').disabled = view.zoom >= 4;
  $('#zoom-out').disabled = view.zoom <= 1;
}

function changeZoom(next, anchor) {
  const zoom = Math.max(1, Math.min(4, next)), ratio = zoom / view.zoom;
  if (anchor) { view.x = anchor.x - (anchor.x - view.x) * ratio; view.y = anchor.y - (anchor.y - view.y) * ratio; }
  else { view.x *= ratio; view.y *= ratio; }
  view.zoom = zoom;
  applyView();
}

function resetView() { view.zoom = 1; view.x = 0; view.y = 0; applyView(); }

function focusObservation() {
  if (id !== 'sketch-story' || compare || mode !== 'drawing') return;
  if (!notesVisible) { notesVisible = true; render(); }
  view.zoom = Math.max(2.5, view.zoom);
  const geometry = viewGeometry(), annotation = currentStage().annotations[pin];
  if (!geometry) return;
  view.x = (0.5 - annotation.x / 100) * geometry.boardWidth * geometry.scale;
  view.y = (0.5 - annotation.y / 100) * geometry.boardHeight * geometry.scale;
  applyView();
  $('#study-viewport').focus({preventScroll: true});
  $('#study-status').textContent = `Focused observation ${pin + 1}: ${annotation.label}. Use Fit to restore the complete study.`;
}

function mountViewer(markup, label, extra = '') {
  const signature = `${id}:${selected}:${compare}:${baseline ?? ''}`;
  if (signature !== view.signature) { view.zoom = 1; view.x = 0; view.y = 0; view.signature = signature; }
  viewObserver?.disconnect();
  const canvas = $('#canvas');
  canvas.classList.add('has-viewer');
  canvas.innerHTML = `<div class="viewer-stage">${extra}<div class="study-viewport" id="study-viewport" tabindex="0" role="group" aria-label="${esc(label)} — zoomable read-only canvas" aria-describedby="viewer-help"><div class="zoom-surface" id="zoom-surface">${markup}</div></div><div class="viewer-meta"><span>${esc(label)}</span><span>AI concept illustration · View only</span></div></div>`;
  const viewport = $('#study-viewport');
  let drag;
  viewport.onpointerdown = event => {
    if (view.zoom <= 1 || !event.isPrimary || event.button !== 0 || event.target.closest('button, a, select, video')) return;
    event.preventDefault();
    viewport.focus({preventScroll: true});
    drag = {id: event.pointerId, startX: event.clientX, startY: event.clientY, x: view.x, y: view.y};
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('dragging');
  };
  viewport.onpointermove = event => {
    if (!drag || event.pointerId !== drag.id) return;
    view.x = drag.x + event.clientX - drag.startX; view.y = drag.y + event.clientY - drag.startY;
    applyView();
  };
  const endDrag = () => { drag = null; viewport.classList.remove('dragging'); };
  viewport.onpointerup = viewport.onpointercancel = viewport.onlostpointercapture = endDrag;
  viewport.onkeydown = event => {
    if (event.target !== viewport) return;
    if (['+', '=', '-', '_', '0', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === '0' || event.key === 'Home') resetView();
      else changeZoom(event.key === '+' || event.key === '=' ? view.zoom * 1.25 : view.zoom / 1.25);
    } else if (view.zoom > 1 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      view.x += event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0;
      view.y += event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0;
      applyView();
    }
  };
  viewport.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    changeZoom(view.zoom * Math.exp(-event.deltaY * 0.002), {x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2});
  }, {passive: false});
  if (typeof ResizeObserver !== 'undefined') { viewObserver = new ResizeObserver(applyView); viewObserver.observe(viewport); viewObserver.observe($('#zoom-surface')); }
  applyView();
}

function renderCanvas(stage, item) {
  const canvas = $('#canvas');
  canvas.className = 'canvas ' + (id === 'project-sketchbook' ? 'book-canvas' : '');
  if (mode === 'film') {
    viewObserver?.disconnect();
    // Updating a reading or perspective must not replace an already loaded player.
    if (canvas.querySelector('video') && !filmUnavailable) return;
    if (filmUnavailable) {
      canvas.innerHTML = `<div class="film-unavailable"><img src="${art(stage)}" alt="AI-generated courtyard concept study"><p>The film is unavailable. The illustrated study is ready to explore.</p><button class="tool" id="return-to-drawing">Return to ${id === 'project-sketchbook' ? 'book spread' : 'drawing'}</button></div>`;
      $('#return-to-drawing').onclick = () => { setMode('drawing'); $('#drawing-tab').focus(); };
      return;
    }
    canvas.innerHTML = `<div class="film-player"><video controls muted playsinline preload="metadata" poster="${art(stage)}" aria-label="${titles[id]} concept film" aria-describedby="film-description" src="${assets}videos/${id}.mp4"></video><p id="film-description" class="visually-hidden">${esc(project.filmDescription)}</p></div>`;
    canvas.querySelector('video').addEventListener('error', () => { filmUnavailable = true; render(); }, {once: true});
    return;
  }
  if (id === 'project-sketchbook') {
    mountViewer(`<article class="book-spread"><div class="book-image"><span>THE COURTYARD INQUIRY</span><img draggable="false" src="${art(stage)}" alt="${esc(stage.title)} — AI-generated conceptual study"><small>${esc(stage.version)} · ${esc(stage.title)}</small></div><div class="book-copy"><span class="chapter-number">${String(selected + 1).padStart(2, '0')}</span><small>${esc(item.subtitle)}</small><h2>${esc(String(item.title).replace(/^\d+\s*·\s*/, ''))}</h2><p>${esc(item.text)}</p><blockquote>${esc(item.reflection)}</blockquote><span class="page-number">${selected + 1}</span></div></article>`, `Chapter ${selected + 1} / ${project.chapters.length} · ${item.subtitle}`);
  } else if (compare && id === 'sketch-story') {
    const pair = archComparisonPair(selected, baseline);
    baseline = pair[0];
    mountViewer(`<div class="comparison">${pair.map(index => `<figure><img draggable="false" src="${art(stages[index])}" alt="${esc(stages[index].version)} — ${esc(stages[index].title)}, independent AI concept illustration"><figcaption><strong>${esc(stages[index].version)} · ${esc(stages[index].title)}</strong><span>${esc(stages[index].decision)}</span></figcaption></figure>`).join('')}</div>`, `${stages[pair[0]].version} ↔ ${stage.version} · Independent alternatives`, `<label class="comparison-control">Compare ${esc(stage.version)} with <select id="comparison-baseline">${stages.map((entry, index) => index === selected ? '' : `<option value="${index}" ${index === baseline ? 'selected' : ''}>${esc(entry.version)} — ${esc(entry.title)}</option>`).join('')}</select></label>`);
    $('#comparison-baseline').onchange = event => { baseline = Number(event.target.value); render(); };
  } else {
    mountViewer(`<div class="drawing-surface"><img draggable="false" src="${art(stage)}" alt="${esc(stage.title)} — AI-generated conceptual study">${id === 'sketch-story' ? `<div class="notes-layer" aria-label="Prepared observation layer" ${notesVisible ? '' : 'hidden'}>${stage.annotations.map((annotation, index) => `<button class="annotation ${index === pin ? 'active' : ''}" style="left:${annotation.x}%;top:${annotation.y}%" data-annotation="${index}" aria-label="Observation ${index + 1}: ${esc(annotation.label)}" aria-pressed="${index === pin}" aria-controls="reading">${index + 1}</button>`).join('')}</div>` : ''}</div>`, `${stage.version} · ${stage.title}`);
    document.querySelectorAll('[data-annotation]').forEach(button => button.onclick = () => { stop(); pin = Number(button.dataset.annotation); tourEnded = false; render(); });
  }
}

function renderReading(stage, item) {
  if (id === 'sketch-story') {
    if (compare && mode === 'drawing') {
      const pair = archComparisonPair(selected, baseline);
      $('#reading').innerHTML = `<h2>Compare the intentions</h2>${pair.map(index => `<section><small>${esc(stages[index].version)}</small><h3>${esc(stages[index].focus)}</h3><p>${esc(stages[index].decision)}</p><p>${esc(stages[index].nextQuestion)}</p></section>`).join('')}<section><small>WHAT WOULD TEST THE IDEA?</small><p>Describe the proposed benefit and its trade-off. Orientation, dimensions, household preferences and a measured plan would be needed to test the claims.</p></section>`;
    } else {
      const annotation = stage.annotations[pin];
      $('#reading').innerHTML = `<h2>${esc(stage.focus)}</h2><p class="lead">${esc(stage.nextQuestion)}</p><div class="annotation-reading"><span>OBSERVATION ${pin + 1}</span><h3>${esc(annotation.label)}</h3><p>${esc(annotation.text)}</p></div><section><small>WHY THIS STUDY EXISTS</small><p>${esc(stage.decision)}</p></section><section><small>PREPARED RETROSPECTIVE REFLECTION</small><p>${esc(stage.reflection)}</p></section>`;
    }
  } else if (id === 'project-sketchbook') {
    $('#reading').innerHTML = `<h2>What to notice</h2>${item.prompts.map((prompt, index) => `<section><small>QUESTION 0${index + 1}</small><p>${esc(prompt)}</p></section>`).join('')}<section><small>THE RECORD</small><p>Six curated chapters connect a brief, initial sketches, alternative readings, a critique and an unresolved question. Select a chapter to inspect its place in that record.</p></section>`;
  } else {
    const readings = archExchangeReadings(item), entry = readings[phase];
    $('#reading').innerHTML = `<h2>${esc(item.title)}</h2><div class="reading-flow" role="tablist" aria-label="Studio exchange sequence">${readings.map((reading, index) => `<button class="reading-chip" id="reading-tab-${index}" role="tab" aria-controls="exchange-reading" aria-selected="${index === phase}" tabindex="${index === phase ? 0 : -1}" data-reading="${index}"><span>${String(index + 1).padStart(2, '0')}</span>${esc(reading.label)}</button>`).join('')}</div><div class="exchange"><article class="active-reading highlight" id="exchange-reading" role="tabpanel" aria-labelledby="reading-tab-${phase}"><small>${String(phase + 1).padStart(2, '0')} / ${esc(entry.label.toUpperCase())}</small><p>${esc(entry.text)}</p><cite>${esc(entry.author)} · ${esc(entry.role)}</cite></article></div><div class="reading-navigation"><button class="tool" id="reading-previous" ${phase === 0 ? 'disabled' : ''} aria-label="Previous exchange reading">←</button><span>${phase + 1} / ${readings.length}</span><button class="tool" id="reading-next" ${phase === readings.length - 1 ? 'disabled' : ''} aria-label="Next exchange reading">→</button></div><p class="exchange-note">Prepared fictional participants · Select a step to follow the exchange.</p>`;
    document.querySelectorAll('[data-reading]').forEach(button => button.onclick = () => chooseReading(Number(button.dataset.reading)));
    $('#reading-previous').onclick = () => chooseReading(phase - 1);
    $('#reading-next').onclick = () => chooseReading(phase + 1);
    $('.reading-flow').onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      chooseReading(event.key === 'Home' ? 0 : event.key === 'End' ? readings.length - 1 : (phase + (event.key === 'ArrowRight' ? 1 : -1) + readings.length) % readings.length);
    };
  }
}

function chooseReading(index) {
  stop(); phase = Math.max(0, Math.min(archExchangeReadings(items()[selected]).length - 1, index)); tourEnded = false;
  render(); $(`[data-reading="${phase}"]`)?.focus({preventScroll: true});
}

function modal(title, html) {
  stop();
  const dialog = $('#dialog'), opener = document.activeElement;
  if (dialog.open) dialog.close();
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2><button aria-label="Close dialog">×</button></div><div class="dialog-body">${html}</div>`;
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.onclose = () => opener?.focus({preventScroll: true});
  dialog.showModal();
  dialog.scrollTop = 0;
}

function bindEvidence() {
  $('#evidence').onclick = () => modal('From research to a working product', `<p>Current recorded stage: <strong>Research — Interactive Demo</strong>. This is the readiness of the proposed research product, separate from interface polish.</p><ol class="maturity-list">${archMaturityLevels.map(level => `<li><h3>${esc(level.title)}</h3><p>${level.evidenceRequired.map(esc).join(' · ')}</p></li>`).join('')}</ol>`);
}

function showSources() {
  modal('Sources & study boundaries', `<p>The scenario, people and drawings are fictional. The illustrations and films are AI-generated. The following primary sources inform the learning method; no measured learning benefit or architectural performance is claimed.</p>${references().map(reference => `<article class="source"><small>${esc(reference.type)} · ${esc(reference.year)}</small><h3><a href="${esc(reference.url)}" target="_blank" rel="noopener">${esc(reference.title)} ↗</a></h3><p>${reference.authors.map(esc).join('; ')}. ${esc(reference.publisher)}</p>${reference.doi ? `<a href="https://doi.org/${esc(reference.doi)}" target="_blank" rel="noopener">DOI ${esc(reference.doi)}</a>` : ''}<p><strong>Use in this demonstration:</strong> ${esc(reference.usedFor)}</p><p>${esc(reference.limitation)}</p></article>`).join('')}`);
}

function finishPrint() {
  document.body.classList.remove('book-print-active');
  $('#print-record')?.remove();
  preparingPrint = false;
  const button = $('#print');
  if (button) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = 'Print record'; }
}

async function printBook() {
  if (preparingPrint) return;
  stop();
  preparingPrint = true;
  const button = $('#print');
  button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'Preparing record…';
  const record = document.createElement('div');
  record.id = 'print-record';
  record.innerHTML = `<h1>Project Sketchbook</h1><p>Fictional courtyard case · Barchinet Global Research Labs · Curated, read-only teaching record</p><p>All illustrations are AI-generated conceptual alternatives. Reflections and contributors are fictional; this is not a measured plan or a record of an actual designer's cognition.</p>${project.chapters.map(chapter => `<article><h2>${esc(chapter.title)}</h2><p>${esc(chapter.subtitle)}</p><img src="${art(stages.find(stage => stage.id === chapter.stageId) || stages[0])}" alt="AI-generated concept study"><p>${esc(chapter.text)}</p><blockquote>${esc(chapter.reflection)}</blockquote><h3>Questions to carry forward</h3><ul>${chapter.prompts.map(prompt => `<li>${esc(prompt)}</li>`).join('')}</ul></article>`).join('')}<article class="print-sources"><h2>Sources & study boundaries</h2>${references().map(reference => `<section><h3>${esc(reference.title)}</h3><p>${reference.authors.map(esc).join('; ')} (${esc(reference.year)}). ${esc(reference.publisher)}</p><p>${esc(reference.usedFor)}</p><p>${esc(reference.limitation)}</p><p><a href="${esc(reference.url)}">${esc(reference.url)}</a></p>${reference.doi ? `<p>DOI: ${esc(reference.doi)}</p>` : ''}</section>`).join('')}</article>`;
  document.body.append(record);
  let missingImages = 0;
  await Promise.all([...record.querySelectorAll('img')].map(image => image.decode().catch(() => { missingImages++; })));
  if (missingImages) record.insertAdjacentHTML('afterbegin', '<p>Some concept illustrations were unavailable when this record was prepared. The chapter text and references are included.</p>');
  document.body.classList.add('book-print-active');
  try { window.print(); } catch { finishPrint(); $('#study-status').textContent = 'The print dialog could not open. Please try Print record again.'; }
}

if (typeof document !== 'undefined') {
  addEventListener('pagehide', () => { stop(); viewObserver?.disconnect(); });
  addEventListener('beforeprint', stop);
  addEventListener('afterprint', finishPrint);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('#dialog')?.open && document.activeElement?.tagName !== 'SELECT' && $('.workbench')?.classList.contains('focused')) {
      toggleFocus(); $('#focus').focus();
    }
  });
  if (project) shell(); else collection();
}
