// Barchinet World: Research Labs prototype.
// One story: explore the world, enter an office, use an instant service, send a simulated request
// with a specialist handoff, then return and continue. Fictional data. Nothing leaves this browser.
import { OFFICES, NEEDS, PROJECT, SCRIPT, office } from './data.mjs';
import * as D from './daylight.mjs';
import { mountPlan, mountSection } from './drawings.mjs';
import * as S from './studio.mjs';
import { Atlas } from './atlas.mjs';
import { LABS_HOME, LABS_ASSETS } from './lib/site.mjs';

const app = document.getElementById('app');
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const query = new URLSearchParams(location.search);
const icons = { arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>', back: '<path d="M20 12H5m6-6-6 6 6 6"/>', check: '<path d="m5 12 4 4L19 6"/>', left: '<path d="m14 6-6 6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>', bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>', person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>', reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>' };
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;

// ---------------------------------------------------------------- state (kept for this tab only)
const KEY = 'bw-prototype-v3';
const fresh = () => ({ visited: {}, need: null, check: { canopy: 1.6, season: 'winter' }, touched: false, request: null, returned: false, continued: false, step: 'check',
  studio: { light: 'winter-noon', anchor: 'entry', roofOff: false, hidden: [], view: '3d' } });
let state = fresh();
try { const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (saved && saved.check && saved.studio) state = { ...fresh(), ...saved }; } catch { /* storage unavailable: keep in memory */ }
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };
const handoff = () => state.request?.stage;                       // 'sent' | 'received' | 'asked' | 'accepted' | 'declined'
const settled = () => ['accepted', 'declined'].includes(handoff());

let live, atlas = null, scene = null, timers = [];
const say = text => { if (live) { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 60); } };
const cleanup = () => { atlas?.destroy(); atlas = null; scene?.dispose(); scene = null; plan = null; section = null; walkIndex = -1; stageWhy = ''; timers.forEach(clearTimeout); timers = []; };

// ---------------------------------------------------------------- shell
const STEPS = [
  { id: 'explore', label: 'Explore the World', done: () => Object.keys(state.visited).length > 0 },
  { id: 'enter', label: 'Enter an office', done: () => !!state.visited.serein },
  { id: 'instant', label: 'Use an instant service', done: () => state.touched },
  { id: 'request', label: 'Request and handoff', done: () => settled() },
  { id: 'return', label: 'Return and continue', done: () => state.continued }
];
function rail() {
  const current = STEPS.findIndex(s => !s.done());
  return `<ol class="bw-rail" aria-label="Your journey in this prototype">${STEPS.map((s, i) => `<li class="${s.done() ? 'is-done' : ''}${i === current ? ' is-current' : ''}"${i === current ? ' aria-current="step"' : ''}><span class="bw-rail-num">${s.done() ? icon('check') : i + 1}</span><span>${s.label}<span class="bw-sr">${s.done() ? ' (done)' : i === current ? ' (current step)' : ''}</span></span></li>`).join('')}</ol>`;
}
function shell(main, title) {
  document.title = `${title} | Barchinet World prototype`;
  app.innerHTML = `<div class="bw-container">
  <header class="bw-head">
    <a class="bw-brand" href="${LABS_HOME}" aria-label="Barchinet Global Research Labs home"><img src="${LABS_ASSETS}barchinet-global.svg" alt="Barchinet Global" width="900" height="230"><small>RESEARCH LABS / BARCHINET WORLD</small></a>
    <nav class="bw-nav" aria-label="Barchinet World"><a href="#/world">The World</a><a href="#/office/serein">Los Angeles office</a><a href="#/about">About this prototype</a><span class="bw-flag">Prototype · fictional data</span></nav>
  </header>
  <div id="bw-rail">${rail()}</div>
  <main id="main">${main}</main>
  <footer class="bw-foot"><span>© ${new Date().getFullYear()} Barchinet Global · Research Labs</span><span>Research prototype. Offices, people and projects are fictional. Nothing you do here is sent anywhere.</span><a href="${LABS_HOME}">Back to Research Labs</a></footer>
  <div id="bw-live" class="bw-sr" aria-live="polite"></div>
</div>`;
  live = $('#bw-live');
  $('.bw-brand img').addEventListener('error', e => { e.target.replaceWith(Object.assign(document.createElement('strong'), { textContent: 'BARCHINET GLOBAL' })); });
}
const refreshRail = () => { const r = $('#bw-rail'); if (r) r.innerHTML = rail(); save(); };
const focusHeading = () => { const h = $('main h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } window.scrollTo(0, 0); };

// ---------------------------------------------------------------- shared pieces
const badge = s => `<span class="bw-badge bw-badge-${s.mode}">${icon(s.mode === 'instant' ? 'bolt' : 'person')}${s.mode === 'instant' ? 'Instant' : 'Human team'} · ${esc(s.name)}</span>`;
function recordCard() {
  if (!state.request) return '';
  const st = handoff(), meridian = office('meridian'), serein = office('serein');
  const lines = [`Brief with ${serein.name}, ${serein.city}.`,
    st === 'accepted' ? `Glare question handed to ${meridian.name}, ${meridian.city}, with your consent.` : st === 'declined' ? 'You kept the brief with one office. No handoff.' : 'The office is replying. Open it to continue.'];
  const next = st === 'accepted' ? `<a class="bw-button bw-primary" href="#/office/meridian">Continue at Meridian Daylight ${icon('arrow')}</a>` : st === 'declined' ? `<a class="bw-button bw-primary" href="#/office/meridian">Visit Meridian Daylight yourself ${icon('arrow')}</a>` : `<a class="bw-button bw-primary" href="#/office/serein">Open the reply ${icon('arrow')}</a>`;
  return `<section class="bw-record" aria-labelledby="record-title">
    <div><div class="bw-eyebrow"><span class="bw-dot"></span> Your project record · simulated</div><h2 id="record-title">${esc(PROJECT.name)} <span class="bw-code">${esc(PROJECT.id)}</span></h2>
    <ul class="bw-record-lines">${lines.map(l => `<li>${icon('check')}<span>${esc(l)}</span></li>`).join('')}</ul></div>
    <div class="bw-record-actions">${next}<a class="bw-button" href="#/office/serein">Reopen Serein Envelope</a><button class="bw-button bw-quiet" type="button" data-action="reset">${icon('reset')} Start over</button></div>
  </section>`;
}

// ---------------------------------------------------------------- view: the World
function viewWorld() {
  if (settled() && !state.returned) { state.returned = true; }
  const back = state.returned && !state.continued;
  shell(`
  <section class="bw-hero">
    <div class="bw-hero-copy">
      <div class="bw-eyebrow"><span class="bw-dot"></span> Research Labs / Barchinet World</div>
      <h1>${back ? 'Back in <em>the World.</em>' : 'A world of <em>online offices.</em>'}</h1>
      <p>${back ? 'Your record came with you. Continue with the next office, or find another by need or by city.' : 'Each office has a place, a specialty and a door. Find one by need or by city, walk in, get a result or leave a brief, then come back and keep going.'}</p>
      <div class="bw-cta">${back ? '' : `<a class="bw-button bw-primary" href="#/office/serein">Enter the Los Angeles pilot office ${icon('arrow')}</a>`}<button class="bw-button" type="button" data-scroll="find">Find an office by need</button></div>
      <div class="bw-meta">${icon('check')} No sign-in. Works by keyboard and without 3D.</div>
    </div>
    <div class="bw-atlas" id="atlas">
      <canvas tabindex="0" role="img" aria-label="Globe showing three office locations: Los Angeles, Rotterdam and Muscat. Use the arrow keys or the rotate buttons to turn it. The same offices are listed below."></canvas>
      <div class="bw-pins">${OFFICES.filter(o => o.lat != null).map(o => `<a class="bw-pin-link" data-pin="${o.id}" href="#/office/${o.id}"><i></i><span><strong>${esc(o.name)}</strong><small>${esc(o.city)}</small></span></a>`).join('')}</div>
      <span class="bw-atlas-label"><span class="bw-dot"></span> ATLAS · 3 CITIES · 4 OFFICES</span>
      <div class="bw-atlas-tools"><button type="button" data-rotate="-40" aria-label="Rotate the globe west">${icon('left')}</button><button type="button" data-rotate="40" aria-label="Rotate the globe east">${icon('right')}</button></div>
    </div>
  </section>
  ${recordCard()}
  <section id="find" class="bw-section">
    <div class="bw-section-head"><div><div class="bw-eyebrow">01 — Start from a need</div><h2>What do you need help with?</h2></div><p>The atlas shows where an office is based.<br>A need shows who can help. Both lead to the same doors.</p></div>
    <div class="bw-needs" role="group" aria-label="Filter offices by need">${NEEDS.map(n => `<button type="button" class="bw-chip" data-need="${n.id}" aria-pressed="${state.need === n.id}">${esc(n.label)}</button>`).join('')}</div>
    <p class="bw-suggest" id="suggest" role="status"></p>
    <div class="bw-offices">${OFFICES.map((o, i) => `<article class="bw-office-card" data-office="${o.id}">
      ${o.thumb ? `<img class="bw-office-thumb" src="${o.thumb}" alt="" loading="lazy" width="640" height="360">` : ''}
      <div class="bw-office-top"><span class="bw-num">0${i + 1}</span><span class="bw-kind">${esc(o.kind)}</span></div>
      <h3><a href="#/office/${o.id}">${esc(o.name)}</a></h3>
      <p class="bw-where">${esc(o.city)}${o.lat != null ? `, ${esc(o.country)}` : ` · ${esc(o.country)}`}</p>
      <p>${esc(o.tagline)}</p>
      <div class="bw-badges">${o.services.map(badge).join('')}</div>
      <div class="bw-office-foot"><span>${o.has3d ? '3D office · pilot' : 'Office page'}${state.visited[o.id] ? ' · visited' : ''}${o.id === 'meridian' && handoff() === 'accepted' ? ' · handoff received' : ''}</span>${icon('arrow')}</div>
    </article>`).join('')}</div>
  </section>`, back ? 'Back in the World' : 'The World');
  const pins = OFFICES.filter(o => o.lat != null), cv = $('#atlas canvas');
  atlas = new Atlas(cv, { pins, reducedMotion: reducedMotion(), onMove: list => list.forEach(p => { const el = $(`[data-pin="${p.id}"]`); if (!el) return; el.style.left = `${p.x * 100}%`; el.style.top = `${p.y * 100}%`; el.dataset.hidden = p.visible ? '' : 'true'; el.dataset.align = p.x > 0.62 ? 'end' : ''; el.tabIndex = p.visible ? 0 : -1; }) });
  if (handoff() === 'accepted') { atlas.arc = [office('serein'), office('meridian')]; atlas.set(-55, 38); } else atlas.set(-95, 26);
  $$('[data-scroll]').forEach(b => b.addEventListener('click', () => { const t = document.getElementById(b.dataset.scroll); t.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }); const h = $('h2', t); h.tabIndex = -1; h.focus({ preventScroll: true }); }));
  $$('[data-rotate]').forEach(b => b.addEventListener('click', () => atlas.rotateBy(Number(b.dataset.rotate))));
  $$('[data-need]').forEach(b => b.addEventListener('click', () => { state.need = state.need === b.dataset.need ? null : b.dataset.need; applyNeed(true); save(); }));
  $$('.bw-office-card').forEach(card => card.addEventListener('click', e => { if (!e.target.closest('a')) location.hash = `#/office/${card.dataset.office}`; }));
  applyNeed(false);
}
function applyNeed(announce) {
  const need = NEEDS.find(n => n.id === state.need);
  $$('[data-need]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.need === state.need)));
  $$('.bw-office-card').forEach(c => { c.classList.toggle('is-match', !!need && c.dataset.office === need.office); c.classList.toggle('is-dim', !!need && c.dataset.office !== need.office); });
  const s = $('#suggest'); if (!s) return;
  if (!need) { s.textContent = ''; return; }
  const o = office(need.office);
  s.innerHTML = `${esc(o.name)}${o.lat != null ? ` in ${esc(o.city)}` : ''} offers <strong>${esc(need.service)}</strong>. <a href="#/office/${o.id}">Enter the office</a>`;
  if (announce && o.lat != null) atlas?.flyTo(o.lon, Math.min(40, o.lat));
}

// ---------------------------------------------------------------- view: Serein Envelope (the Courtyard studio, pilot office)
function officeHead(o, extra = '') {
  return `<div class="bw-office-head"><a class="bw-back" href="#/world">${icon('back')} The World</a>
    <div class="bw-eyebrow"><span class="bw-dot"></span> ${esc(o.kind)} · ${esc(o.city)}${o.lat != null ? `, ${esc(o.country)}` : ''}</div>
    <h1>${esc(o.name)}</h1><p class="bw-lead">${esc(o.tagline)}</p>
    <p class="bw-resp">${icon('person')} Responsible: ${esc(o.lead.name)}, ${esc(o.lead.role.toLowerCase())} <span class="bw-fict">fictional</span>${extra}</p></div>`;
}
let plan = null, section = null, walkIndex = -1, autoRoof = false, galleryIndex = 0;
const studio = () => state.studio;
const radios = (name, opts, value) => opts.map(([v, label, sub]) => `<label class="bw-option"><input type="radio" name="${name}" value="${v}"${v === value ? ' checked' : ''}><span><strong>${label}</strong>${sub ? `<small>${sub}</small>` : ''}</span></label>`).join('');

function viewSerein() {
  const o = office('serein'), c = state.check, st = studio();
  shell(`
  <div class="bw-office-hero">
    ${officeHead(o)}
    <figure class="bw-hero-still"><img src="${S.stillUrl('late-afternoon', 'exterior')}" alt="${esc(S.GALLERY.find(g => g.state === 'late-afternoon' && g.view === 'exterior').alt)}" width="1600" height="900"><figcaption>The Courtyard studio, late afternoon. Path-traced render (Blender Cycles). A fictional building; the neighbouring blocks are schematic massing.</figcaption></figure>
  </div>

  <section class="bw-section bw-explore" aria-labelledby="explore-title">
    <div class="bw-section-head"><div><div class="bw-eyebrow">01 — Walk in</div><h2 id="explore-title">Explore the studio</h2></div><p>Pick a time of day, then move by the plan, the hotspots or the guided walk.<br>The interactive model shows light baked into its surfaces.</p></div>
    <div class="bw-light" role="group" aria-label="Time of day">${S.STATE_ORDER.map(id => `<button type="button" data-light="${id}" aria-pressed="${st.light === id}"><strong>${S.STATES[id].label}</strong><small>${S.STATES[id].sub}</small></button>`).join('')}</div>
    <div class="bw-office-grid">
      <div class="bw-stage">
        <div class="bw-stage-view" id="stage" data-mode="still">
          <img class="bw-still" id="poster" src="${S.stillFor(st.light, S.ANCHORS[st.anchor].still)}" alt="" width="1600" height="900">
          <div class="bw-hotspots" id="hotspots">${S.WALK.filter(id => id !== 'room_centre').map(id => `<button type="button" class="bw-hotspot" data-hot="${id}" hidden><i></i><span>${esc(S.ANCHORS[id].label)}</span></button>`).join('')}</div>
          <div class="bw-loading" id="loading" hidden><span id="loading-text">Loading the model</span><i><b></b></i></div>
          <span class="bw-stage-tag" id="stage-tag"></span>
        </div>
        <div class="bw-stage-bar">
          <div class="bw-seg" role="group" aria-label="Show"><button type="button" data-view="3d" aria-pressed="false">3D model</button><button type="button" data-view="still" aria-pressed="true">Rendered stills</button></div>
          <button type="button" class="bw-toggle" id="roof" aria-pressed="false">Roof off</button>
          <div class="bw-turn" id="turn" hidden><button type="button" data-turn="0.4" aria-label="Look left">${icon('left')}</button><button type="button" data-turn="-0.4" aria-label="Look right">${icon('right')}</button><button type="button" data-zoom="-8" aria-label="Zoom in">+</button><button type="button" data-zoom="8" aria-label="Zoom out">−</button></div>
        </div>
        <p class="bw-stage-note" id="stage-note"></p>
        <div class="bw-here" id="here" role="status"></div>
        <div class="bw-walk" id="walk"></div>
        <details class="bw-layers" id="layers"><summary>Layers</summary><p class="bw-hint">Hide parts of the 3D model. Hidden layers stay hidden when you change the time of day.</p><div class="bw-layer-grid">${S.LAYERS.map(n => `<label><input type="checkbox" data-layer="${esc(n)}"${st.hidden.includes(n) ? '' : ' checked'}> ${esc(n)}</label>`).join('')}</div></details>
      </div>
      <div class="bw-plan-card">
        <div class="bw-plan-host" id="plan" aria-label="Floor plan with numbered places"></div>
        <p class="bw-plan-note" id="plan-note" role="status"></p>
        <div class="bw-places" role="group" aria-label="Go to a place">${S.WALK.map(id => `<button type="button" class="bw-chip bw-chip-small" data-place="${id}" aria-pressed="false">${esc(S.ANCHORS[id].label)}</button>`).join('')}</div>
      </div>
    </div>
  </section>

  <section class="bw-section" aria-labelledby="services-title">
    <div class="bw-section-head"><div><div class="bw-eyebrow">02 — Use the office</div><h2 id="services-title">Services</h2></div><p>One instant service and one that goes to people.<br>On the table: <strong>${esc(PROJECT.name)}</strong>, a fictional courtyard house.</p></div>
    <div class="bw-panel">
      <nav class="bw-steps" aria-label="Service steps">
        <button type="button" data-step="check"><span>1</span> Instant check</button>
        <button type="button" data-step="request"><span>2</span> Request</button>
        <button type="button" data-step="handoff"><span>3</span> Handoff</button>
      </nav>
      <div class="bw-step" id="step-check">
        <div class="bw-check-grid">
          <div>
            <h2>Daylight and shade check</h2>
            <p class="bw-muted">The studio’s bay stands in for the ${esc(PROJECT.name)} living-room opening. Change the canopy depth and see the noon sun on the section at once.</p>
            <div class="bw-field"><label for="canopy">Canopy depth <output id="canopy-out"></output></label><input id="canopy" type="range" min="0" max="2.4" step="0.1" value="${c.canopy}" aria-describedby="canopy-hint"><p class="bw-hint" id="canopy-hint">The studio is built with a ${D.ROOM.canopyAsModelled.toFixed(1)} m canopy. The 3D model and the renders always show that one.</p></div>
            <fieldset class="bw-field"><legend>Noon on</legend><div class="bw-options bw-three">${radios('season', Object.entries(D.SEASONS).map(([k, s]) => [k, s.long.split(' ')[0], s.label]), c.season)}</div></fieldset>
            <div class="bw-stats" id="stats"></div>
            <p class="bw-summary" id="summary" role="status"></p>
            <h3>Noon review for this canopy</h3>
            <div id="review"></div>
            <p class="bw-note" id="lowsun"></p>
          </div>
          <div>
            <div class="bw-section-host" id="section" aria-label="Daylight section through the courtyard bay"></div>
            <p class="bw-hint">Drawn section with the built canopy and the summer and winter noon sun. The teal line is your what-if.</p>
            <p class="bw-limits">Direct noon sun on a clear day only, for ${D.SITE.name} (34° N), with sun angles in whole degrees as on the drawing. Only the courtyard bay is counted. Sky light, reflections, the timber fins, the east window, trees and neighbours are not. A prototype teaching model, not a design or code-compliance result.</p>
            <button class="bw-button bw-primary bw-wide" type="button" data-step="request">Send this check to the office ${icon('arrow')}</button>
          </div>
        </div>
      </div>
      <div class="bw-step bw-step-narrow" id="step-request" hidden></div>
      <div class="bw-step bw-step-narrow" id="step-handoff" hidden></div>
    </div>
  </section>

  <section class="bw-section" aria-labelledby="gallery-title">
    <div class="bw-section-head"><div><div class="bw-eyebrow">03 — Look closer</div><h2 id="gallery-title">Gallery</h2></div><p>Thirteen path-traced renders and one plan render.<br>Not photographs. The building is fictional.</p></div>
    <div class="bw-needs" role="group" aria-label="Filter renders by time of day"><button type="button" class="bw-chip" data-gallery="all" aria-pressed="true">All</button>${S.STATE_ORDER.map(id => `<button type="button" class="bw-chip" data-gallery="${id}" aria-pressed="false">${S.STATES[id].label}</button>`).join('')}</div>
    <div class="bw-gallery" id="gallery">${S.GALLERY.map((g, i) => `<button type="button" class="bw-shot" data-shot="${i}" data-state="${g.state}"><img src="${g.thumb}" alt="${esc(g.alt)}" loading="lazy" width="640" height="${g.view === 'plan' ? 477 : 360}"><span>${esc(g.caption)}</span></button>`).join('')}</div>
    <dialog class="bw-lightbox" id="lightbox" aria-label="Render viewer"><figure><img id="lightbox-img" alt=""><figcaption id="lightbox-cap"></figcaption></figure><div class="bw-lightbox-bar"><button type="button" class="bw-button" data-lb="-1">${icon('left')} Previous</button><button type="button" class="bw-button" data-lb="1">Next ${icon('right')}</button><button type="button" class="bw-button bw-primary" data-lb="close">Close</button></div></dialog>
  </section>`, o.name);

  // explore
  $$('[data-light]').forEach(b => b.addEventListener('click', () => setLight(b.dataset.light, true)));
  $$('[data-hot]').forEach(b => b.addEventListener('click', () => setAnchor(b.dataset.hot, true)));
  $$('[data-place]').forEach(b => b.addEventListener('click', () => setAnchor(b.dataset.place, true)));
  $$('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view, true)));
  $$('[data-turn]').forEach(b => b.addEventListener('click', () => scene?.nudge(Number(b.dataset.turn))));
  $$('[data-zoom]').forEach(b => b.addEventListener('click', () => scene?.zoom(Number(b.dataset.zoom))));
  $('#roof').addEventListener('click', () => { const off = !st.roofOff; autoRoof = false; setRoof(off, true); if (off) setAnchor('room_centre', true); else if (st.anchor === 'room_centre') setAnchor('entry', true); });
  $$('[data-layer]').forEach(cb => cb.addEventListener('change', () => { if (cb.dataset.layer === 'Roof and ceiling') { autoRoof = false; setRoof(!cb.checked, true); } else setLayer(cb.dataset.layer, cb.checked); }));
  mountPlan($('#plan'), { onPick: id => setAnchor(id, true) }).then(api => { if (!$('#plan')) return; plan = api; plan.setOverlay(S.STATES[st.light].overlay); plan.highlight(S.ANCHORS[st.anchor].planAnchor || st.anchor); });
  renderWalk(); showLight(); showAnchor(false);
  setView(st.view === '3d' && query.get('3d') !== 'off' ? '3d' : 'still', false);

  // services
  $$('[data-step]').forEach(b => b.addEventListener('click', () => setStep(b.dataset.step, true)));
  const touch = () => { if (!state.touched) { state.touched = true; refreshRail(); } };
  $$('input[name=season]').forEach(r => r.addEventListener('change', () => { c.season = r.value; touch(); updateCheck(true); }));
  $('#canopy').addEventListener('input', e => { c.canopy = Number(e.target.value); touch(); updateCheck(); });
  mountSection($('#section')).then(api => { if (!$('#section')) return; section = api; updateCheck(); });
  renderRequest(); renderHandoff(); updateCheck();
  setStep(handoff() ? 'handoff' : state.step === 'handoff' ? 'check' : state.step, false);

  // gallery
  $$('[data-gallery]').forEach(b => b.addEventListener('click', () => { $$('[data-gallery]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $$('.bw-shot').forEach(s => { s.hidden = b.dataset.gallery !== 'all' && s.dataset.state !== b.dataset.gallery; }); }));
  const box = $('#lightbox'), showShot = i => { const list = $$('.bw-shot').filter(s => !s.hidden).map(s => Number(s.dataset.shot)); if (!list.length) return; if (!list.includes(i)) i = list[0]; galleryIndex = i; const g = S.GALLERY[i]; $('#lightbox-img').src = g.src; $('#lightbox-img').alt = g.alt; $('#lightbox-cap').textContent = `${g.caption}. Path-traced render (Blender Cycles).`; return list; };
  $$('.bw-shot').forEach(b => b.addEventListener('click', () => { showShot(Number(b.dataset.shot)); if (box.showModal) box.showModal(); else box.setAttribute('open', ''); }));
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => { if (b.dataset.lb === 'close') return box.close ? box.close() : box.removeAttribute('open'); const list = $$('.bw-shot').filter(s => !s.hidden).map(s => Number(s.dataset.shot)), at = list.indexOf(galleryIndex); showShot(list[(at + Number(b.dataset.lb) + list.length) % list.length]); }));
  box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') $('[data-lb="-1"]').click(); if (e.key === 'ArrowRight') $('[data-lb="1"]').click(); });
  box.addEventListener('close', () => $(`.bw-shot[data-shot="${galleryIndex}"]`)?.focus());
}

// ----- light state
function showLight() {
  const st = studio(), L = S.STATES[st.light];
  $$('[data-light]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.light === st.light)));
  plan?.setOverlay(L.overlay);
  const note = $('#plan-note'); if (note) note.textContent = `${L.label}. ${L.note}${L.overlay ? ' The plan shows it.' : ' The plan has no sun overlay for this state.'}`;
  showStill();
}
function setLight(id, user) {
  const st = studio(); if (!S.STATES[id]) return;
  st.light = id; if (user && !state.touched) { state.touched = true; refreshRail(); }
  save(); showLight(); scene?.setState(id);
  if (user) say(`${S.STATES[id].label}. ${S.STATES[id].note}`);
}
// The still behind the 3D view, and the picture shown when 3D is off or unavailable.
function showStill() {
  const st = studio(), img = $('#poster'); if (!img) return;
  const roofPlan = st.roofOff && $('#stage').dataset.mode === 'still';
  img.src = roofPlan ? S.stillUrl('summer-noon', 'plan') : S.stillFor(st.light, S.ANCHORS[st.anchor].still);
  img.classList.toggle('is-contain', roofPlan);
  if ($('#stage').dataset.mode === 'still') {
    const exact = S.STATES[st.light].stills.includes(S.ANCHORS[st.anchor].still);
    img.alt = roofPlan ? 'Plan view of the studio rendered from above with the roof removed, at summer noon.' : `Path-traced render of the studio, ${S.STATES[st.light].label.toLowerCase()}.`;
    $('#stage-tag').textContent = roofPlan ? 'PATH-TRACED RENDER · ROOF OFF · SUMMER NOON' : `PATH-TRACED RENDER · ${S.STATES[st.light].label.toUpperCase()}`;
    $('#stage-note').textContent = (roofPlan ? (st.light === 'summer-noon' ? 'Roof-off plan render.' : 'The roof-off render exists for summer noon only, so that is what you see.') : exact ? 'Rendered still nearest to the place you chose.' : `There is no ${S.ANCHORS[st.anchor].still} render for ${S.STATES[st.light].label.toLowerCase()}, so the interior render is shown.`) + (stageWhy ? ` ${stageWhy}` : ' Switch to the 3D model to look around freely.');
  } else img.alt = '';
}

// ----- anchors, roof, layers, guided walk
function showAnchor(announce) {
  const st = studio(), a = S.ANCHORS[st.anchor];
  plan?.highlight(a.planAnchor || st.anchor);
  $$('[data-place]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.place === st.anchor)));
  $$('[data-hot]').forEach(b => b.classList.toggle('is-active', b.dataset.hot === st.anchor));
  const here = $('#here'); if (here) here.innerHTML = `<strong>${esc(a.label)}</strong><span>${esc(a.text)}</span>`;
  showStill();
  if (announce) say(`${a.label}. ${a.text}`);
}
function setAnchor(id, user) {
  const st = studio(), a = S.ANCHORS[id]; if (!a) return;
  st.anchor = id;
  if (a.roofOff && !st.roofOff) { autoRoof = true; setRoof(true, false); } else if (!a.roofOff && st.roofOff && autoRoof) { autoRoof = false; setRoof(false, false); }
  scene?.goTo(id);
  const w = S.WALK.indexOf(id); if (walkIndex >= 0 && w >= 0) { walkIndex = w; renderWalk(); }
  save(); showAnchor(user);
}
function setLayer(name, visible) {
  const st = studio(); st.hidden = st.hidden.filter(n => n !== name); if (!visible) st.hidden.push(name);
  scene?.setLayer(name, visible); save();
}
function setRoof(off, announce) {
  const st = studio(); st.roofOff = off; setLayer('Roof and ceiling', !off);
  const b = $('#roof'); if (b) { b.setAttribute('aria-pressed', String(off)); b.textContent = off ? 'Roof on' : 'Roof off'; }
  const cb = $('[data-layer="Roof and ceiling"]'); if (cb) cb.checked = !off;
  showStill(); if (announce) say(off ? 'Roof hidden.' : 'Roof shown.');
}
function renderWalk() {
  const el = $('#walk'); if (!el) return;
  if (walkIndex < 0) { el.innerHTML = `<div><strong>Guided walk</strong><span>Ten stops, from the entry to the courtyard, ending with the roof off.</span></div><button type="button" class="bw-button" data-walk="start">Start the walk ${icon('arrow')}</button>`; }
  else el.innerHTML = `<div><strong>Guided walk · stop ${walkIndex + 1} of ${S.WALK.length}</strong><span>${esc(S.ANCHORS[S.WALK[walkIndex]].label)}</span></div><div class="bw-walk-actions"><button type="button" class="bw-button" data-walk="prev"${walkIndex === 0 ? ' disabled' : ''}>${icon('left')} Back</button><button type="button" class="bw-button bw-primary" data-walk="next">${walkIndex === S.WALK.length - 1 ? 'Finish' : `Next ${icon('right')}`}</button><button type="button" class="bw-button bw-quiet" data-walk="end">End</button></div>`;
  $$('[data-walk]', el).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.walk;
    if (k === 'start') { walkIndex = 0; setAnchor(S.WALK[0], true); }
    else if (k === 'prev') { walkIndex -= 1; setAnchor(S.WALK[walkIndex], true); }
    else if (k === 'next' && walkIndex < S.WALK.length - 1) { walkIndex += 1; setAnchor(S.WALK[walkIndex], true); }
    else { walkIndex = -1; say('Guided walk ended.'); }
    renderWalk(); $(`[data-walk="${walkIndex < 0 ? 'start' : 'next'}"]`)?.focus();
  }));
}

// ----- stage: the 3D model when available and chosen, otherwise the rendered stills
let stageWhy = '';
function setView(view, user) {
  const stage = $('#stage'); if (!stage) return;
  const st = studio();
  const show = mode => {
    stage.dataset.mode = mode;
    $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === (mode === 'still' ? 'still' : '3d'))));
    $('#turn').hidden = mode !== '3d'; $('#layers').classList.toggle('is-off', mode === 'still');
    $$('[data-layer]').forEach(cb => { if (cb.dataset.layer !== 'Roof and ceiling') cb.disabled = mode === 'still'; });
    if (mode !== '3d') $$('[data-hot]').forEach(h => { h.hidden = true; });
    if (mode === '3d') { $('#stage-tag').textContent = 'INTERACTIVE 3D · BAKED LIGHT'; $('#stage-note').textContent = 'Drag or use the arrow keys on the view to look around; plus and minus zoom. The light is baked into the surfaces, so it changes only with the time of day.'; }
    if (mode === 'loading') { $('#stage-tag').textContent = 'PATH-TRACED RENDER'; $('#stage-note').textContent = 'Loading the 3D model. Everything else already works.'; }
    showStill();
  };
  if (view === 'still') { if (user) { st.view = 'still'; save(); stageWhy = ''; } scene?.dispose(); scene = null; $('#loading').hidden = true; show('still'); return; }
  if (user) { st.view = '3d'; save(); }
  if (scene) return;
  stageWhy = ''; show('loading'); $('#loading').hidden = false; $('#loading-text').textContent = `Loading the ${S.STATES[st.light].label.toLowerCase()} model`;
  const fallback = why => { scene = null; $('#loading').hidden = true; $('[data-view="3d"]').disabled = true; stageWhy = `${why} You are seeing the rendered stills instead; the plan, the walk and the services work the same.`; show('still'); say(`${why} Showing rendered stills instead.`); };
  import('./office3d.mjs').then(mod => {
    if (!$('#stage') || stage.dataset.mode !== 'loading') return;
    if (query.get('3d') === 'off' || !mod.webglAvailable()) return fallback('3D is not available in this browser.');
    scene = new mod.OfficeScene(stage, {
      state: st.light, reducedMotion: reducedMotion(),
      onProgress: p => { const bar = $('#loading b'); if (bar) bar.style.width = `${Math.round(p * 100)}%`; },
      onState: e => {
        const chip = $('#loading'); if (!chip) return;
        if (e.loading) { chip.hidden = false; $('#loading b').style.width = '4%'; $('#loading-text').textContent = `Loading the ${S.STATES[e.state].label.toLowerCase()} ${e.first ? 'model' : 'light'}`; }
        else { chip.hidden = true; if (e.failed) say('That light state could not be loaded.'); else if (!e.first) say(`${S.STATES[e.state].label} light loaded.`); }
      },
      onReady: () => { show('3d'); if (user) say('3D model loaded.'); },
      onError: () => fallback('The 3D model could not start on this device.'),
      onFrame: s => { stage.dataset.cam = s.camera.position.toArray().map(n => n.toFixed(1)).join(','); stage.dataset.light = s.state || ''; stage.dataset.hidden = [...s.hidden].join('|'); $$('[data-hot]').forEach(h => { const p = stage.dataset.mode === '3d' && !s.tween ? s.project(h.dataset.hot) : null; h.hidden = !p; if (p) { h.style.left = `${p.x * 100}%`; h.style.top = `${p.y * 100}%`; h.dataset.align = p.x > 0.7 ? 'end' : ''; } }); }
    });
    scene.anchorId = st.anchor; for (const n of st.hidden) scene.setLayer(n, false);
  }).catch(() => fallback('The 3D model could not be loaded.'));
}

// ----- services
function setStep(step, user) {
  if (step === 'handoff' && !state.request) step = 'request';
  state.step = step; save();
  ['check', 'request', 'handoff'].forEach(s => { const el = $(`#step-${s}`); if (el) el.hidden = s !== step; });
  $$('.bw-steps [data-step]').forEach(b => { const on = b.dataset.step === step; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  if (user) { const h = $(`#step-${step} h2`); if (h) { h.tabIndex = -1; h.focus({ preventScroll: false }); } }
}
function currentResult() { return D.check({ ...state.check, hour: 12 }); }
function updateCheck(announce = false) {
  if (!$('#canopy')) return;
  const c = state.check, r = currentResult();
  $('#canopy-out').textContent = c.canopy < 0.05 ? 'none' : `${c.canopy.toFixed(1)} m`;
  $('#canopy').setAttribute('aria-valuetext', c.canopy < 0.05 ? 'No canopy' : `${c.canopy.toFixed(1)} metres`);
  const stat = (k, v) => `<div><span>${k}</span><strong>${v}</strong></div>`;
  $('#stats').innerHTML = stat('Glass shaded', D.formatPercent(r.shadedShare)) + stat('Sun reaches', D.formatMetres(r.reach)) + stat('Sunlit floor', `${r.patchArea.toFixed(1)} m²`) + stat('Noon sun', `${Math.round(r.sun.altitude)}°`);
  $('#summary').textContent = D.summary(r);
  section?.whatIf(r, `What-if: ${c.canopy < 0.05 ? 'no canopy' : `${c.canopy.toFixed(1)} m canopy`}, ${D.SEASONS[c.season].long.toLowerCase()} noon`);
  const rows = D.noonReview(c.canopy), passed = rows.filter(x => x.pass).length, range = D.passingDepths();
  $('#review').innerHTML = `<table class="bw-table"><caption class="bw-sr">Noon results for the three prototype targets</caption><thead><tr><th scope="col">Noon on</th><th scope="col">Target</th><th scope="col">Sun reaches</th><th scope="col">Result</th></tr></thead><tbody>${rows.map(x => `<tr><th scope="row">${D.SEASONS[x.season].long}</th><td>${x.target.max != null ? `at most ${x.target.max.toFixed(1)} m` : `at least ${x.target.min.toFixed(1)} m`}</td><td>${x.reach.toFixed(1)} m</td><td><span class="bw-result ${x.pass ? 'is-pass' : 'is-miss'}">${x.pass ? 'Meets it' : 'Misses it'}</span></td></tr>`).join('')}</tbody></table>
    <p class="bw-verdict">${passed === 3 ? '<strong>This canopy meets all three noon targets.</strong>' : `<strong>Meets ${passed} of 3 noon targets.</strong>${range ? ` Depths from ${range[0].toFixed(1)} to ${range[1].toFixed(1)} m meet all three.` : ''}`}</p>`;
  const low = D.lowSunNote(c.canopy);
  $('#lowsun').innerHTML = low.length ? `<strong>Low winter sun.</strong> On December 21 direct sun lands on the ${low.map(l => `${l.label} (${l.ranges.map(([a, b]) => a === b ? D.formatHour(a) : `${D.formatHour(a)} to ${D.formatHour(b)}`).join(', ')})`).join(' and the ')}. That is a glare question for a daylight specialist.` : '<strong>Low winter sun.</strong> Direct sun stays off the review table and the sofa on December 21.';
  const attach = $('#attach'); if (attach && !state.request) attach.textContent = attachText();
  if (announce) say(D.summary(r));
  save();
}
const attachText = (c = state.check) => `${c.canopy < 0.05 ? 'No canopy' : `${c.canopy.toFixed(1)} m canopy`}, ${D.SEASONS[c.season].long.toLowerCase()} noon. ${D.summary(D.check({ ...c, hour: 12 }))}`;

function renderRequest() {
  const el = $('#step-request'); if (!el) return;
  const sent = !!state.request;
  el.innerHTML = `<h2>Ask the office to review it</h2>
    <p class="bw-muted">${esc(office('serein').lead.name)}’s team reads briefs for ${esc(PROJECT.name)}. This is a simulation: the reply is scripted and nothing is sent.</p>
    <form id="brief" class="bw-form" novalidate>
      <div class="bw-field"><span class="bw-label">Project</span><p class="bw-fixed">${esc(PROJECT.name)} <span class="bw-code">${esc(PROJECT.id)}</span> <span class="bw-fict">fictional sample</span></p><p class="bw-hint">${esc(PROJECT.summary)}</p></div>
      <div class="bw-field"><label for="question">Your question</label><select id="question"${sent ? ' disabled' : ''}>${PROJECT.questions.map((q, i) => `<option value="${i}"${state.request?.question === i ? ' selected' : ''}>${esc(q)}</option>`).join('')}</select></div>
      <div class="bw-field"><span class="bw-label">Attached automatically</span><p class="bw-attach" id="attach">${esc(attachText(state.request?.check || state.check))}</p></div>
      <div class="bw-field"><label for="note">Note to the office <span class="bw-optional">optional</span></label><textarea id="note" rows="3" maxlength="240"${sent ? ' disabled' : ''} aria-describedby="note-hint">${esc(state.request?.note || '')}</textarea><p class="bw-hint" id="note-hint">Please do not type personal details. The note stays in this browser tab and is cleared when you start over.</p></div>
      <button class="bw-button bw-primary bw-wide" type="submit"${sent ? ' disabled' : ''}>${sent ? 'Brief sent (simulated)' : `Send brief (simulated) ${icon('arrow')}`}</button>
      ${sent ? `<button class="bw-button bw-wide" type="button" data-step="handoff">See the reply ${icon('arrow')}</button>` : ''}
    </form>`;
  $('#brief').addEventListener('submit', e => {
    e.preventDefault(); if (state.request) return;
    state.request = { question: Number($('#question').value), note: $('#note').value.trim().slice(0, 240), check: { ...state.check }, stage: 'sent' };
    save(); renderRequest(); renderHandoff(); setStep('handoff', true); playHandoff(); say('Brief sent. This is a simulation.');
  });
  $$('#step-request [data-step]').forEach(b => b.addEventListener('click', () => setStep(b.dataset.step, true)));
}
function playHandoff() {
  const advance = (stage, ms) => timers.push(setTimeout(() => { if (!state.request || settled()) return; state.request.stage = stage; save(); renderHandoff(); if (stage === 'asked') say('The office replied and asks a question.'); }, reducedMotion() ? 0 : ms));
  if (handoff() === 'sent') { advance('received', 900); advance('asked', 2300); } else if (handoff() === 'received') advance('asked', 900);
}
function renderHandoff() {
  const el = $('#step-handoff'); if (!el) return;
  const req = state.request; if (!req) { el.innerHTML = ''; return; }
  const st = req.stage, serein = office('serein'), meridian = office('meridian'), order = ['sent', 'received', 'asked', 'accepted'];
  const at = s => st === 'declined' ? s !== 'accepted' : order.indexOf(st) >= order.indexOf(s);
  const item = (title, body, who = '') => `<li><span class="bw-tl-dot"></span><div><strong>${title}</strong>${who ? `<span class="bw-who">${who}</span>` : ''}<p>${body}</p></div></li>`;
  el.innerHTML = `<h2>Reply and handoff</h2>
    <p class="bw-muted">Simulated. No message has left this browser.</p>
    <ol class="bw-timeline">
      ${item('Brief sent', `“${esc(PROJECT.questions[req.question])}” with your check attached.${req.note ? ` Note: “${esc(req.note)}”` : ''}`, 'You')}
      ${at('received') ? item('Received', esc(SCRIPT.received(serein)), serein.name) : '<li class="is-wait"><span class="bw-tl-dot"></span><div><p>Waiting for the office…</p></div></li>'}
      ${at('asked') ? item('Reply', esc(SCRIPT.reply), `${serein.lead.name}, ${serein.name}`) : ''}
      ${st === 'accepted' ? item('Handoff accepted', esc(SCRIPT.accepted), meridian.name) : ''}
      ${st === 'declined' ? item('No handoff', esc(SCRIPT.declined), serein.name) : ''}
    </ol>
    ${st === 'asked' ? `<div class="bw-consent" role="group" aria-labelledby="consent-q"><p id="consent-q"><strong>Share this brief with ${esc(meridian.name)}?</strong> You decide. One office can also finish the job alone.</p><div class="bw-consent-actions"><button class="bw-button bw-primary" type="button" data-consent="accepted">Yes, share with ${esc(meridian.name)}</button><button class="bw-button" type="button" data-consent="declined">No, keep it with ${esc(serein.name)}</button></div></div>` : ''}
    ${settled() ? `<div class="bw-done"><p><strong>${st === 'accepted' ? 'Two offices now share one record.' : 'One office holds the record.'}</strong> In a working version this is where scope, fee and milestones would be agreed in a private project space. That part is not built.</p><a class="bw-button bw-primary bw-wide" href="#/world">Return to the World ${icon('arrow')}</a></div>` : ''}`;
  $$('[data-consent]').forEach(b => b.addEventListener('click', () => { state.request.stage = b.dataset.consent; refreshRail(); renderHandoff(); say(b.dataset.consent === 'accepted' ? 'Handoff accepted by Meridian Daylight.' : 'The brief stays with Serein Envelope.'); $('.bw-done a')?.focus(); }));
}

// ---------------------------------------------------------------- views: the other offices
function receivedBrief() {
  if (handoff() !== 'accepted') return '';
  const req = state.request;
  return `<section class="bw-received" aria-labelledby="rb"><div class="bw-eyebrow"><span class="bw-dot"></span> Handoff received · simulated</div><h2 id="rb">${esc(PROJECT.name)} <span class="bw-code">${esc(PROJECT.id)}</span></h2><p>From ${esc(office('serein').name)}, shared with your consent: “${esc(PROJECT.questions[req.question])}”</p><p class="bw-attach">${esc(attachText(req.check))}</p></section>`;
}
function viewMeridian() {
  const o = office('meridian'), c = state.request?.check || state.check;
  const hours = [9, 10, 11, 12, 13, 14, 15, 16].map(h => ({ h, r: D.check({ canopy: c.canopy, season: 'winter', hour: h }) }));
  shell(`${officeHead(o)}
  <div class="bw-two">
    <div>${receivedBrief() || `<section class="bw-received is-empty"><h2>No brief here yet</h2><p>You can use this office on its own, or arrive with a handoff from another office.</p><a class="bw-button" href="#/office/serein">Start at Serein Envelope</a></section>`}
      <section class="bw-card"><h2>What this office does</h2><ul class="bw-list">${o.specialties.map(s => `<li>${esc(s)}</li>`).join('')}</ul><div class="bw-badges">${o.services.map(badge).join('')}</div><p class="bw-muted">${esc(o.sample)}</p></section></div>
    <section class="bw-card"><h2>First look: December 21, hour by hour</h2><p class="bw-muted">The same simplified sun model as the Los Angeles office, for the courtyard bay with a ${c.canopy.toFixed(1)} m canopy.</p>
      <table class="bw-table"><caption class="bw-sr">Direct sun by hour on the winter solstice</caption><thead><tr><th scope="col">Solar time</th><th scope="col">Sun reaches</th><th scope="col">Lands on</th></tr></thead><tbody>${hours.map(({ h, r }) => `<tr><th scope="row">${D.formatHour(h)}</th><td>${r.facing ? `${r.reach.toFixed(1)} m` : '0.0 m'}</td><td>${r.lit.length ? r.lit.map(k => D.FURNITURE[k].label).join(', ') : 'floor only'}</td></tr>`).join('')}</tbody></table>
      <div class="bw-plan-small" id="plan-static"></div><p class="bw-hint">Plan of the Los Angeles studio with the winter noon sun patch for the built 1.6 m canopy. A real review would add sky light, reflections and what people are doing at each hour.</p></section>
  </div>${nextSteps(o.id)}`, o.name);
  mountPlan($('#plan-static')).then(api => api.setOverlay('winter'));
}
function viewFold() {
  const o = office('fold'), g = S.GALLERY.find(x => x.view === 'plan');
  shell(`${officeHead(o)}
  <div class="bw-two">
    <section class="bw-card"><h2>What this office does</h2><ul class="bw-list">${o.specialties.map(s => `<li>${esc(s)}</li>`).join('')}</ul><div class="bw-badges">${o.services.map(badge).join('')}</div><p class="bw-muted">${esc(o.sample)}</p><p class="bw-hint">A brief here would work the same way as in Los Angeles. In this prototype only the Los Angeles office accepts one.</p></section>
    <section class="bw-card"><h2>Sample base: a plan to draw over</h2><figure class="bw-figure"><img src="${g.src}" alt="${esc(g.alt)}" loading="lazy" width="1600" height="1192"><figcaption>Plan render of the Los Angeles studio with the roof off (path-traced, summer noon). A layout study would be drawn as two options over a base like this.</figcaption></figure></section>
  </div>${nextSteps(o.id)}`, o.name);
}
function viewCommon() {
  const o = office('common-ground');
  shell(`${officeHead(o)}
  <div class="bw-two">
    <section class="bw-card"><h2>Shade Lab</h2><p class="bw-muted">A room faces the sun. Pick a canopy that keeps the spring sun near the window and still lets the low winter sun in.</p>
      <fieldset class="bw-field"><legend>Which canopy will do both?</legend><div class="bw-options bw-three">${radios('lab', [['0.4', 'Short lip', '0.4 m'], ['1.4', 'Middle canopy', '1.4 m'], ['2.4', 'Deep canopy', '2.4 m']], '0.4')}</div></fieldset>
      <button class="bw-button bw-primary" type="button" id="lab-test">Test this canopy ${icon('arrow')}</button>
      <div id="lab-out" role="status" class="bw-lab-out"></div><div class="bw-section-host" id="lab-section" hidden></div></section>
    <section class="bw-card"><h2>Why it is here</h2><p>${esc(o.tagline)}</p><p class="bw-muted">${esc(o.sample)}</p><ul class="bw-list">${o.specialties.map(s => `<li>${esc(s)}</li>`).join('')}</ul><p class="bw-hint">Try it with two people: one predicts, the other tests. Then swap.</p></section>
  </div>${nextSteps(o.id)}`, o.name);
  let lab = null; mountSection($('#lab-section')).then(api => { lab = api; });
  $('#lab-test').addEventListener('click', () => {
    const d = Number($('input[name=lab]:checked').value), rows = D.noonReview(d), s = rows.find(r => r.season === 'equinox'), w = rows.find(r => r.season === 'winter'), ok = rows.every(r => r.pass), season = ok || !s.pass ? 'equinox' : 'winter';
    $('#lab-out').innerHTML = `<p><strong>${ok ? 'This canopy does both.' : 'Not quite. Try another.'}</strong> ${ok ? 'It blocks the high sun and still lets the low sun in. Can you say why?' : !s.pass ? 'A longer roof would keep more of the spring sun out.' : 'This roof also blocks the low winter sun. Try a shorter one.'}</p><p class="bw-hint">Spring noon: sun reaches ${s.reach.toFixed(1)} m. Winter noon: ${w.reach.toFixed(1)} m. The teal line on the drawing shows your canopy at ${season === 'equinox' ? 'spring' : 'winter'} noon.</p>`;
    $('#lab-section').hidden = false; lab?.whatIf(D.check({ canopy: d, season, hour: 12 }), `Your canopy: ${d.toFixed(1)} m`);
  });
}
function nextSteps(id) {
  const others = OFFICES.filter(o => o.id !== id);
  return `<section class="bw-next"><h2>Keep going</h2><div class="bw-next-row"><a class="bw-button bw-primary" href="#/world">${icon('back')} The World</a>${others.map(o => `<a class="bw-button" href="#/office/${o.id}">${esc(o.name)}</a>`).join('')}</div></section>`;
}

// ---------------------------------------------------------------- view: about
function viewAbout() {
  shell(`<div class="bw-office-head"><a class="bw-back" href="#/world">${icon('back')} The World</a><div class="bw-eyebrow"><span class="bw-dot"></span> Research Labs / Barchinet World</div><h1>About this prototype</h1><p class="bw-lead">A walk-through of one idea: architecture offices as places you can find, enter and use.</p></div>
  <div class="bw-two">
    <section class="bw-card"><h2>What is real here</h2><ul class="bw-list"><li>The daylight and shade check calculates in your browser from the canopy depth and the noon sun for Los Angeles, and draws the result on the section.</li><li>The 3D studio is shown in real time with four baked light states. The plan, the hotspots and the guided walk all move the same camera.</li><li>Everything works by keyboard, without sign-in and without 3D.</li></ul></section>
    <section class="bw-card"><h2>What is simulated</h2><ul class="bw-list"><li>All offices, people, the Cypress House project and the record number are fictional.</li><li>The brief, the reply and the handoff are scripted. No message, file or payment is sent.</li><li>Your choices are kept for this browser tab only and are cleared when you choose Start over.</li></ul><button class="bw-button" type="button" data-action="reset">${icon('reset')} Start over</button></section>
    <section class="bw-card"><h2>Limits of the sun model</h2><p class="bw-muted">Direct sun on a clear day only. No sky light, reflected light, glazing properties, fins, trees, neighbours or weather. Solar time, not clock time. It is a teaching model and not a design, energy or code-compliance result.</p></section>
    <section class="bw-card"><h2>About the pictures and the 3D model</h2><p class="bw-muted">The Courtyard studio is a fictional building. The stills in the hero and the gallery are path-traced renders made in Blender Cycles; they are not photographs. The interactive 3D model shows light that was path-traced once for each of four moments and baked into its surfaces, so it cannot show other times, moving shadows or reflections, and its colours differ from the stills. The neighbouring blocks around the studio are schematic massing, not real buildings. The plan and the daylight section are drawings.</p></section>
  </div>${nextSteps('')}`, 'About this prototype');
}

// ---------------------------------------------------------------- router
function route() {
  cleanup();
  const [, kind, id] = (location.hash || '#/world').split('/');
  if (kind === 'office' && office(id)) {
    if (state.returned && !state.continued) state.continued = true;
    state.visited[id] = true; save();
    ({ serein: viewSerein, meridian: viewMeridian, fold: viewFold, 'common-ground': viewCommon })[id]();
    if (id === 'serein' && state.request && !settled()) playHandoff();
  } else if (kind === 'about') viewAbout(); else viewWorld();
  $$('[data-action="reset"]').forEach(b => b.addEventListener('click', () => { state = fresh(); save(); if (location.hash === '#/world') route(); else location.hash = '#/world'; }));
  refreshRail(); focusHeading();
}
window.addEventListener('hashchange', route);
route();
