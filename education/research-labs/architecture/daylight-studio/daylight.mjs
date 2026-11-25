// Daylight Studio: path-traced stills first, then a baked-light model with linked plan, section, walk and layers.
// The 3D engine and the 3 to 4 MB model are loaded only when the visitor asks for them.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const here = new URL('.', import.meta.url);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const viewNames = { exterior: 'Outside', interior: 'Inside', table: 'Review table', courtyard: 'Courtyard' };

async function drawing(path) { // fetch an SVG and scope its <style> so it cannot restyle the page
  const text = await (await fetch(new URL(path, here))).text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml'), svg = doc.documentElement;
  if (svg.nodeName !== 'svg' || doc.querySelector('parsererror')) throw new Error('Drawing could not be read');
  for (const bad of svg.querySelectorAll('script, foreignObject, metadata')) bad.remove();
  for (const style of svg.querySelectorAll('style')) style.textContent = style.textContent.replace(/(^|})\s*([^{}]+)\{/g, (_, close, selectors) => `${close} ${selectors.split(',').map(s => '.ds-drawing ' + s.trim()).join(', ')} {`);
  return document.importNode(svg, true);
}

async function init() {
  const manifest = await (await fetch(new URL('manifest.json', here))).json();
  const states = manifest.states, anchors = manifest.anchors, stateOf = key => states.find(s => s.key === key);
  const params = new URLSearchParams(location.hash.slice(1));
  let state = stateOf(params.get('light')) ? params.get('light') : states[0].key;
  let still = 'exterior', mode = 'stills', viewer = null, engine = null, roofParts = [], roofHidden = false, layerNodes = new Map(), hidden = new Set();
  let loadToken = 0, current = null, walkIndex = -1, sheet = 'plan', activeAnchor = null, lastAnchors = {};
  const stage = $('#ds-stage'), poster = $('#ds-poster'), status = $('#ds-status'), planBox = $('#ds-sheet');
  const say = text => { status.textContent = text; };
  const remember = () => { const next = new URLSearchParams(); next.set('light', state); if (activeAnchor) next.set('at', activeAnchor); history.replaceState(null, '', '#' + next); };

  /* ---------- light state, stills ---------- */
  $('#ds-states').innerHTML = states.map(s => `<button type="button" data-state="${s.key}" aria-pressed="false"><b>${esc(s.label)}</b><small>${esc(s.detail)}</small></button>`).join('');
  function renderStills() {
    const s = stateOf(state); if (!s.stills.includes(still)) still = s.stills[0];
    $('#ds-still-tabs').innerHTML = s.stills.map(v => `<button type="button" data-still="${v}" aria-pressed="${v === still}">${viewNames[v]}</button>`).join('');
    poster.innerHTML = `<img src="${new URL(`stills/${state}-${still}.webp`, here)}" alt="Path-traced render: ${esc(viewNames[still].toLowerCase())} view, ${esc(s.label.toLowerCase())}" width="1600" height="900" decoding="async"><span class="ds-tag">Path-traced render · ${esc(s.detail)}</span>`;
  }
  function renderState() {
    const s = stateOf(state);
    for (const button of $$('[data-state]')) button.setAttribute('aria-pressed', String(button.dataset.state === state));
    $('#ds-caption').textContent = s.caption; $('#ds-caption-title').textContent = s.detail;
    for (const layer of $$('[data-state]', planBox)) layer.style.display = layer.id === s.planLayer ? '' : 'none';
    renderStills(); viewer?.markTime(state); remember();
  }
  async function setState(key, { announce = true } = {}) {
    if (!stateOf(key)) return;
    state = key; renderState();
    if (announce) say(`${stateOf(key).label}. ${stateOf(key).caption}`);
    if (mode === '3d') await loadModel();
  }

  /* ---------- 3D ---------- */
  function applyLayers() {
    for (const [name, node] of layerNodes) node.visible = !hidden.has(name) && !(roofHidden && roofParts.includes(node));
    viewer?.draw();
    $('#roof-toggle').setAttribute('aria-pressed', String(roofHidden)); $('#roof-toggle').textContent = roofHidden ? 'Show roof' : 'Hide roof';
    for (const box of $$('[data-layer]')) { box.checked = !hidden.has(box.dataset.layer) && !(roofHidden && manifest.cutaway.some(p => box.dataset.layer.toLowerCase().startsWith(p))); }
  }
  function hotspots(found) {
    lastAnchors = found;
    return anchors.map(a => ({ id: a.id, label: a.label, text: a.text, position: found[a.id] || a.view.target, view: a.view }));
  }
  async function loadModel() {
    const s = stateOf(state), token = ++loadToken;
    if (current === state) return;
    stage.classList.add('is-loading'); $('#ds-loading').textContent = `Loading ${s.label.toLowerCase()} light…`;
    try {
      const result = await engine.loadGlb(new URL(s.model, here), { bakedEncoding: manifest.bakedEncoding });
      if (token !== loadToken) return;
      layerNodes = new Map(result.scene.children.filter(n => !/^ANCHOR_/i.test(n.name)).map(n => [n.name, n]));
      roofParts = [...layerNodes].filter(([name]) => manifest.cutaway.some(p => name.toLowerCase().startsWith(p))).map(([, node]) => node);
      const first = current === null;
      viewer.showGround(false); viewer.setBackdrop(s.sky[0], s.sky[1]);
      viewer.replace(result.scene, { size: manifest.view.size, center: manifest.view.center, hotspots: hotspots(result.anchors), keepPose: !first });
      current = state; applyLayers();
      if (activeAnchor) viewer.selectHotspot(anchors.findIndex(a => a.id === activeAnchor), true);
      $('#ds-source').textContent = `Interactive model with baked light: ${s.detail}. The light was path-traced in Blender and stored in the textures, so it does not change as you move. Glass is drawn as a flat tint, without reflections.`;
    } catch (error) {
      if (token !== loadToken) return;
      console.error(error); showStills();
      $('#ds-source').textContent = `The 3D model could not be loaded (${error.message}). The path-traced stills are shown instead.`;
    } finally { if (token === loadToken) stage.classList.remove('is-loading'); }
  }
  function no3d() {
    viewer = null; mode = 'stills'; document.body.classList.add('ds-no3d'); showStills();
    $('#ds-open3d').disabled = true; $('#ds-open3d').textContent = '3D is not available in this browser';
    $('#ds-source').textContent = 'This browser cannot draw the 3D model. The path-traced stills, the plan and the section all still work.';
  }
  async function open3d() {
    if (mode === '3d') return true;
    if (!engine) {
      $('#ds-open3d').disabled = true; $('#ds-open3d').textContent = 'Loading the 3D engine…';
      try { const [view, glb] = await Promise.all([import('../../assets/model-viewer.mjs?v=3'), import('../../assets/glb-lite.mjs?v=3')]); engine = { ...view, ...glb }; }
      catch (error) { console.error(error); $('#ds-open3d').disabled = false; $('#ds-open3d').textContent = 'Explore in 3D'; say('The 3D engine could not be loaded. Check the connection and try again.'); return false; }
      $('#ds-open3d').disabled = false; $('#ds-open3d').textContent = 'Explore in 3D';
      viewer = engine.createModelViewer(stage, {
        enablePan: true, shift: 0, minDistance: .6, tour: false, home: manifest.view.home, time: state,
        timeStates: states.map(s => ({ key: s.key, label: s.label, title: s.detail })),
        purpose: 'Baked-light model. Turn it, step inside with the numbered points, and change the light.',
        tips: ['Drag to look around, scroll or pinch to move closer', 'Numbered points take you to a place and explain it', 'The light buttons swap the baked light and keep your view', 'Keys: arrows turn, + and − zoom, 0 resets'],
        storageKey: 'barchinet.hint.daylight', schematic: 'Neighbouring blocks are schematic massing',
        onTimeChange: key => setState(key), onError: no3d,
        onHotspot: spot => { markAnchor(spot.id, { from3d: true }); },
      });
      if (!viewer) return false;
    }
    mode = '3d'; document.body.classList.add('ds-3d'); poster.hidden = true; stage.hidden = false;
    $('#ds-mode-stills').setAttribute('aria-pressed', 'false'); $('#ds-mode-3d').setAttribute('aria-pressed', 'true');
    await loadModel();
    return mode === '3d';
  }
  function showStills() {
    mode = 'stills'; document.body.classList.remove('ds-3d'); poster.hidden = false; stage.hidden = true;
    $('#ds-mode-stills').setAttribute('aria-pressed', 'true'); $('#ds-mode-3d').setAttribute('aria-pressed', 'false');
    $('#ds-source').textContent = 'Path-traced stills rendered in Blender Cycles. Open the 3D model to move around the same building with its light baked in.';
  }

  /* ---------- anchors: plan <-> 3D ---------- */
  function markAnchor(id, { from3d = false } = {}) {
    activeAnchor = id;
    for (const el of $$('[data-anchor]', planBox)) el.classList.toggle('is-on', el.dataset.anchor === id);
    for (const button of $$('[data-goto]')) button.setAttribute('aria-pressed', String(button.dataset.goto === id));
    const anchor = anchors.find(a => a.id === id);
    if (anchor) { $('#ds-anchor-title').textContent = anchor.label; $('#ds-anchor-text').textContent = anchor.text; if (from3d) say(`${anchor.label}. ${anchor.text}`); }
    remember();
  }
  async function goTo(id, { quiet = false } = {}) {
    const index = anchors.findIndex(a => a.id === id); if (index < 0) return;
    markAnchor(id);
    if (!(await open3d())) { if (!quiet) say(`${anchors[index].label}. ${anchors[index].text}`); return; }
    if (roofHidden) { roofHidden = false; applyLayers(); }
    viewer.selectHotspot(index);
    if (!quiet) say(`${anchors[index].label}: camera moved. ${anchors[index].text}`);
  }
  function overview() {
    activeAnchor = null; for (const el of $$('.is-on', planBox)) el.classList.remove('is-on');
    for (const button of $$('[data-goto]')) button.setAttribute('aria-pressed', 'false');
    $('#ds-anchor-title').textContent = 'Pick a numbered point'; $('#ds-anchor-text').textContent = 'On the plan, in the list, or in the 3D view. Each one moves the camera and explains what is there.';
    viewer?.clearHotspot(); viewer?.fitView(); remember();
  }

  /* ---------- plan, section, rendered plan ---------- */
  const sheets = {};
  async function showSheet(key) {
    sheet = key;
    for (const tab of $$('[data-sheet]')) { const on = tab.dataset.sheet === key; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; }
    planBox.setAttribute('aria-labelledby', 'sheet-tab-' + key);
    try {
      if (key === 'rendered') planBox.innerHTML = `<img src="${new URL(manifest.plan.rendered, here)}" alt="Roof-off view from straight above at summer noon: desks along the north wall, review table inside the south bay, olive tree in the courtyard" width="2000" height="1490" loading="lazy">`;
      else { sheets[key] ||= await drawing(key === 'plan' ? manifest.plan.drawing : manifest.plan.section); planBox.replaceChildren(sheets[key]); }
    } catch (error) { console.error(error); planBox.innerHTML = '<p class="ds-error">This drawing could not be loaded. Reload the page to try again.</p>'; }
    $('#ds-sheet-note').textContent = { plan: 'Drawn plan, north up. Numbered points are linked to the 3D view. The shaded patch shows where noon sun or shade falls for the winter and summer states.', section: 'Drawn section, south to north, at latitude 34° N: the summer and winter noon sun against the 1.6 m canopy.', rendered: 'Path-traced render from straight above with the roof removed, summer noon. North is up.' }[key];
    renderState(); if (activeAnchor) markAnchor(activeAnchor);
  }

  /* ---------- guided walk ---------- */
  async function walkTo(index) {
    const steps = manifest.walk; walkIndex = Math.max(0, Math.min(steps.length - 1, index)); const step = steps[walkIndex];
    $('#ds-walk').classList.add('is-on');
    $('#walk-count').textContent = `Step ${walkIndex + 1} of ${steps.length}`; $('#walk-title').textContent = step.title; $('#walk-text').textContent = step.text;
    $('#walk-prev').disabled = walkIndex === 0; $('#walk-next').textContent = walkIndex === steps.length - 1 ? 'Finish' : 'Next';
    $('#walk-start').hidden = true; $('#walk-nav').hidden = false;
    if (step.state && step.state !== state) await setState(step.state, { announce: false });
    if (step.anchor) await goTo(step.anchor, { quiet: true }); else if (await open3d()) { if (roofHidden) { roofHidden = false; applyLayers(); } overview(); }
    say(`Step ${walkIndex + 1} of ${steps.length}: ${step.title}. ${step.text}`);
  }
  function endWalk() { walkIndex = -1; $('#ds-walk').classList.remove('is-on'); $('#walk-start').hidden = false; $('#walk-nav').hidden = true; $('#walk-title').textContent = 'Guided walk'; $('#walk-text').textContent = `${manifest.walk.length} short steps through the building and its four light states.`; say('Walk finished. Explore freely.'); }

  /* ---------- wiring ---------- */
  $('#ds-states').addEventListener('click', e => { const b = e.target.closest('[data-state]'); if (b) setState(b.dataset.state); });
  $('#ds-still-tabs').addEventListener('click', e => { const b = e.target.closest('[data-still]'); if (b) { still = b.dataset.still; renderStills(); $(`[data-still="${still}"]`).focus(); if (mode === '3d') showStills(); } });
  $('#ds-open3d').onclick = async () => { if (await open3d()) $('canvas', stage).focus({ preventScroll: true }); };
  $('#ds-mode-3d').onclick = () => open3d(); $('#ds-mode-stills').onclick = showStills;
  $('#roof-toggle').onclick = async () => { if (!(await open3d())) return; roofHidden = !roofHidden; applyLayers(); say(roofHidden ? 'Roof and ceiling hidden. You are looking into the room from outside.' : 'Roof and ceiling shown.'); };
  $('#ds-top').onclick = async () => { if (!(await open3d())) return; roofHidden = true; applyLayers(); viewer.clearHotspot(); viewer.top(); say('Looking straight down with the roof hidden. North is up, as on the plan.'); };
  $('#ds-reset').onclick = async () => { if (!(await open3d())) return; roofHidden = false; applyLayers(); overview(); say('View reset.'); };
  $('#ds-zoom-in').onclick = () => viewer?.zoom(1.25); $('#ds-zoom-out').onclick = () => viewer?.zoom(1 / 1.25);
  $('#ds-layers').innerHTML = manifest.layers.map(l => `<label><input type="checkbox" data-layer="${esc(l.node)}" checked><span>${esc(l.label)}${l.note ? ` <em>${esc(l.note)}</em>` : ''}</span></label>`).join('');
  $('#ds-layers').addEventListener('change', async e => { const box = e.target.closest('[data-layer]'); if (!box) return; const name = box.dataset.layer, show = box.checked; if (!(await open3d())) { box.checked = true; return; } if (show) { hidden.delete(name); if (manifest.cutaway.some(p => name.toLowerCase().startsWith(p))) roofHidden = false; } else hidden.add(name); applyLayers(); say(`${name} ${show ? 'shown' : 'hidden'}.`); });
  $('#ds-goto').innerHTML = anchors.map((a, i) => `<li><button type="button" data-goto="${a.id}" aria-pressed="false"><span>${i + 1}</span>${esc(a.label)}</button></li>`).join('');
  $('#ds-goto').addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) goTo(b.dataset.goto); });
  const pickOnPlan = e => { const el = e.target.closest?.('[data-anchor]'); if (el && planBox.contains(el) && anchors.some(a => a.id === el.dataset.anchor)) { e.preventDefault(); goTo(el.dataset.anchor); } };
  planBox.addEventListener('click', pickOnPlan);
  planBox.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pickOnPlan(e); });
  const tabs = $$('[data-sheet]');
  for (const tab of tabs) tab.onclick = () => showSheet(tab.dataset.sheet);
  $('#ds-sheet-tabs').addEventListener('keydown', e => { const at = tabs.indexOf(document.activeElement); if (at < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (at + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; tabs[next].focus(); tabs[next].click(); });
  $('#walk-start').onclick = () => walkTo(0); $('#walk-prev').onclick = () => walkTo(walkIndex - 1);
  $('#walk-next').onclick = () => (walkIndex >= manifest.walk.length - 1 ? endWalk() : walkTo(walkIndex + 1)); $('#walk-end').onclick = endWalk;

  endWalk(); status.textContent = ''; showStills(); await showSheet('plan');
  // The plan's own numbering follows the drawing; the list beside it is the large-target route to the same anchors.
  if (anchors.some(a => a.id === params.get('at'))) markAnchor(params.get('at'));
  document.documentElement.classList.add('studio-ready');
}

init().catch(error => { console.error(error); document.documentElement.classList.add('module-failed'); const s = document.querySelector('#ds-source'); if (s) s.textContent = 'This page could not start. Reload to try again.'; });
