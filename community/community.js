// The Community page: the campus photograph with a numbered callout for each public project, the project sheet, the
// list view, the project index with its key plan, sharing and joining. Projects come from the public list
// (community-data.js); every project value is written with textContent, never as HTML.
import { inPicture, plots, daylightNow } from './campus-data.js';
import { mountCampus, buildingCrop, setCrop } from './campus-stage.js';
import { initMenu, initMotion, statusWriter } from './site.js';
import { anchorFor, joinDestination, loadProjects, membershipHref, shareUrl, signedIn, slugFromHash } from './community-data.js';

const $ = (id) => document.getElementById(id);
const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const wide = matchMedia('(min-width: 1000px)');
const hero = $('campus'), stage = $('stage'), sheet = $('sheet');
const moving = () => document.documentElement.classList.contains('moving');
const LIGHT_NAMES = { morning: 'Morning', day: 'Day', sunset: 'Sunset', night: 'Night' };
const status = statusWriter('status');
const placed = (p) => !!plots[p.plot];
const communityJoin = '/membership?' + new URLSearchParams({ mode: 'signup', next: joinDestination(null) });

let projects = [];
let member = false;
const memberCheck = signedIn().then((value) => { member = value; if (value) updateJoinLinks(); return value; });

initMenu();

// ---- Shared pieces of a project ----------------------------------------------------------------------------
function facts(p, { question = true } = {}) {
  const dl = make('dl', 'facts');
  const row = (cls, term, text) => { const d = make('div', cls); d.append(make('dt', '', term), make('dd', '', text)); dl.append(d); };
  if (question && p.question) row('q', 'Research question', p.question);
  if (p.summary) row('', 'About the project', p.summary);
  if (p.task) row('', 'An example first task', p.task);
  if (p.level) row('meta', 'Level', p.level);
  row('meta', 'Time', p.time || 'Set by each project, shown before you ask to join');
  return dl;
}
function actions(p) {
  const wrap = make('div', 'actions');
  const join = make('button', 'btn btn-primary', 'Join this project'); join.type = 'button';
  join.setAttribute('aria-label', 'Join ' + p.title);
  join.addEventListener('click', () => openJoin(p, join));
  const copy = make('button', 'btn btn-quiet', 'Copy share link'); copy.type = 'button';
  copy.setAttribute('aria-label', 'Copy share link for ' + p.title);
  copy.addEventListener('click', () => copyLink(p, wrap));
  wrap.append(join, copy);
  return wrap;
}
// Copy the stable link; when the clipboard is not available, show the link itself, selected, to copy by hand.
async function copyLink(p, wrap) {
  const url = shareUrl(p);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('No clipboard');
    await navigator.clipboard.writeText(url);
    status('Share link copied: ' + url);
  } catch {
    let box = wrap.parentElement.querySelector(':scope > .share-fallback');
    if (!box) {
      box = make('p', 'share-fallback');
      const label = make('label', '', 'Copy this link for ' + p.title);
      const field = make('input'); field.type = 'text'; field.readOnly = true; field.id = 'share-' + p.slug + '-' + Math.random().toString(36).slice(2, 7);
      label.htmlFor = field.id;
      box.append(label, field);
      wrap.after(box);
    }
    const field = box.querySelector('input');
    field.value = url;
    field.focus();
    field.select();
    status('Your browser did not allow copying. The link is shown under the buttons: ' + url, 9000);
  }
}

// ---- The campus ----------------------------------------------------------------------------------------------
const titleBand = document.querySelector('.title-block');
const SHEET_W = () => Math.min(420, Math.max(360, innerWidth * 0.3));
const campus = mountCampus(stage, {
  projects: [],
  frame(w, h) {
    // Fit the buildings and their labels (about 0.13 to 0.80 of the picture's height) into the part of the
    // photograph that the title band leaves free.
    if (wide.matches) {
      const band = titleBand.offsetHeight, free = h - band;
      return { width: (free - 30) / 0.67 * 1.6, point: [0.5, 0.13], at: [w / 2, 18], zoom: 1.35, selAt: [(w - SHEET_W()) / 2, free * 0.52] };
    }
    if (w < 700) return { width: w / 0.64, point: [0.5, 0.5], at: [w / 2, h / 2], zoom: 1.35, compact: true };
    return { width: w * 1.08, point: [0.5, 0.47], at: [w / 2, h / 2], zoom: 1.4 };
  },
  occluders: () => blocks(),
  onChoose: (p, el) => choose(p, el),
  onStatus: (text) => status(text),
});
// Panels laid over the photograph: callouts beneath them are hidden. Measured once, again after a change.
let blockCache = null;
function blocks() {
  if (!wide.matches) return [];
  if (!blockCache) {
    const s = stage.getBoundingClientRect();
    const rel = (el) => { const r = el.getBoundingClientRect(); return { left: r.left - s.left, right: r.right - s.left, top: r.top - s.top, bottom: r.bottom - s.top }; };
    blockCache = [rel(titleBand), rel(document.querySelector('.controls'))];
    if (!sheet.hidden) blockCache.push(rel(sheet));
  }
  return blockCache;
}
const dropBlocks = () => { blockCache = null; };
addEventListener('resize', dropBlocks);
let origin = null;
let keyButtons = [];
const sheetCrop = buildingCrop(null, '', { w: 0.24, aspect: 2 }); $('sheet-pic').append(sheetCrop);
const pictureAlt = (p) => (placed(p) ? 'The building for ' + p.title + ' on the campus render: ' + p.building + '.'
  : 'Barchinet hall on the campus render; this project has no building on the picture yet.');
function choose(p, from, { focus = true } = {}) {
  campus.select(p);
  keyButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.slug === p?.slug)));
  $('stage-note').hidden = !!p;
  if (!p) { sheet.hidden = true; hero.classList.remove('has-sheet'); dropBlocks(); history.replaceState(null, '', location.pathname + location.search); return; }
  origin = from ?? origin ?? campus.tagFor(p);
  $('sheet-n').textContent = String(p.n);
  $('sheet-name').textContent = p.title;
  $('sheet-kicker').textContent = 'Project ' + p.n + ' of ' + projects.length;
  setCrop(sheetCrop, p.plot, pictureAlt(p), { w: 0.24, aspect: 2 });
  $('sheet-facts').replaceWith(Object.assign(facts(p), { id: 'sheet-facts' }));
  sheet.querySelector('.share-fallback')?.remove();
  $('sheet-actions').replaceWith(Object.assign(actions(p), { id: 'sheet-actions' }));
  $('sheet-close').setAttribute('aria-label', 'Close ' + p.title);
  $('sheet-prev').hidden = $('sheet-next').hidden = projects.length < 2;
  sheet.hidden = false; hero.classList.add('has-sheet'); dropBlocks();
  history.replaceState(null, '', '#' + anchorFor(p));
  if (focus) {
    $('sheet-title').focus({ preventScroll: wide.matches });
    if (!wide.matches) sheet.scrollIntoView({ block: 'nearest', behavior: moving() ? 'smooth' : 'auto' });
  }
}
function closeSheet() {
  const back = origin; origin = null;
  choose(null);
  if (back && back.offsetParent !== null && getComputedStyle(back).visibility !== 'hidden') back.focus(); else (wide.matches ? campus.tagFor(projects[0]) : keyButtons[0])?.focus();
}
const step = (d) => { const p = campus.selected; if (!p || !projects.length) return; choose(projects[(projects.indexOf(p) + d + projects.length) % projects.length], null); };
$('sheet-prev').addEventListener('click', () => step(-1));
$('sheet-next').addEventListener('click', () => step(1));
$('sheet-close').addEventListener('click', closeSheet);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || $('join').open) return;
  if (!sheet.hidden) { event.preventDefault(); closeSheet(); }
  else if (hero.classList.contains('is-list')) { event.preventDefault(); setList(false); $('list-toggle').focus(); }
  else if (document.querySelector('.site-header.is-open')) { const b = document.querySelector('.menu-button'); b.click(); b.focus(); }
});

$('list-toggle').addEventListener('click', () => setList(!hero.classList.contains('is-list')));
function setList(on) {
  if (on && !sheet.hidden) choose(null);
  hero.classList.toggle('is-list', on);
  $('campus-list').hidden = !on;
  $('list-toggle').setAttribute('aria-pressed', String(on));
  status(on ? 'Showing the projects as a list.' : 'Showing the campus.');
}

// Light: Auto follows the visitor's clock. A colour grade over the photograph until a render exists for each light.
const lightButtons = [...document.querySelectorAll('.light .seg')];
function setLight(name, announce = true) {
  const actual = campus.setLight(name);
  lightButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.light === name)));
  if (announce) status('Light: ' + (name === 'auto' ? 'Auto, ' + LIGHT_NAMES[actual].toLowerCase() + ' by your clock' : LIGHT_NAMES[actual]) + '. A colour grade, not a final render.');
}
lightButtons.forEach((b) => b.addEventListener('click', () => setLight(b.dataset.light)));
lightButtons[0].setAttribute('aria-label', 'Auto, by your clock (now ' + LIGHT_NAMES[daylightNow()] + ')');

initMotion($('motion-toggle'), (on) => campus.setMotion(on), status);

// "Pick a building": take the visitor to the first callout (or the list).
document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
  if (!projects.length) return;
  if (b.dataset.pick === 'list' && !hero.classList.contains('is-list')) setList(true);
  $('stage').scrollIntoView({ behavior: moving() ? 'smooth' : 'auto', block: wide.matches ? 'center' : 'start' });
  const target = hero.classList.contains('is-list') ? $('campus-list').querySelector('button')
    : !wide.matches ? keyButtons[0] : campus.tagFor(projects.find(placed)) ?? $('campus-list').querySelector('button');
  target?.focus({ preventScroll: true });
  if (!hero.classList.contains('is-list')) status(wide.matches ? 'Choose a building on the campus. Tab moves between them.' : 'Choose a numbered building, or a name in the list under the campus.');
}));

// ---- Joining: the chosen project is carried through sign-in, sign-up and approval ------------------------------
let joinOrigin = null;
const joinCrop = buildingCrop(null, '', { w: 0.26, aspect: 16 / 7 }); $('join-pic').append(joinCrop);
async function openJoin(p, from) {
  // A signed-in, approved member goes straight to the project's join panel in the workspace.
  if (member || await Promise.race([memberCheck, new Promise((resolve) => setTimeout(() => resolve(false), 1500))])) {
    location.assign(joinDestination(p));
    return;
  }
  joinOrigin = from;
  $('join-title').textContent = 'Join ' + p.title;
  setCrop(joinCrop, p.plot, '', { w: 0.26, aspect: 16 / 7 });
  $('join-land').textContent = 'You land at the join request for ' + p.title + '; Barchinet reads it and answers.';
  $('join-signin').href = membershipHref(p);
  $('join-signup').href = membershipHref(p, 'signup');
  $('join').showModal();
}
$('join').addEventListener('click', (event) => { if (event.target.closest('[data-close]') || event.target === $('join')) $('join').close(); });
$('join').addEventListener('close', () => joinOrigin?.focus());
// "Join the community" without a project lands on the workspace's project list (after sign-in when needed).
function updateJoinLinks() {
  document.querySelectorAll('[data-join-community]').forEach((link) => { link.href = member ? joinDestination(null) : communityJoin; });
}
updateJoinLinks();

// ---- States: loading, projects, none yet, failed ------------------------------------------------------------
function setState(name) {
  document.body.classList.toggle('is-loading', name === 'loading');
  document.body.classList.toggle('is-empty', name === 'empty');
  document.body.classList.toggle('is-error', name === 'error');
  const live = name === 'ready';
  document.querySelectorAll('[data-pick]').forEach((b) => { b.hidden = !live; });
  document.querySelectorAll('[data-join-community], [data-contact]').forEach((b) => { b.hidden = live || name === 'loading'; });
  $('list-toggle').hidden = !live;
}
function card({ heading, level = 'h2', text, error = false, retry = false }) {
  const box = make('div', 'state-card' + (error ? ' is-error' : ''));
  const links = make('div', 'actions');
  if (retry) {
    const again = make('button', 'btn btn-primary', 'Try again'); again.type = 'button';
    again.addEventListener('click', () => { again.disabled = true; void start(); });
    links.append(again);
  }
  const join = make('a', retry ? 'btn btn-quiet' : 'btn btn-primary', 'Join the community'); join.href = member ? joinDestination(null) : communityJoin;
  join.dataset.joinCommunity = '';
  const contact = make('a', 'text-link', 'Contact Barchinet'); contact.href = '/about/#contact';
  links.append(join, contact);
  box.append(make(level, '', heading), ...text.map((line) => make('p', '', line)), links);
  return box;
}
function showLoading() {
  setState('loading');
  $('stage-state').replaceChildren(make('p', 'ss-loading', 'Loading the open projects…'));
  $('p-state').replaceChildren(make('p', 'ss-loading', 'Loading the open projects…'));
}
function showEmpty() {
  setState('empty');
  const text = ['No project is open to join yet. Each project that opens gets a building on this campus and a page here.',
    'You can make your account now. Joining is always free.'];
  $('stage-state').replaceChildren(card({ heading: 'Projects open here soon', text }));
  $('p-state').replaceChildren(card({ heading: 'Projects open here soon', level: 'h3', text }));
  $('stage-note').hidden = true;
}
function showError() {
  setState('error');
  const text = ['The list of projects did not load. Check your connection and try again. The rest of this page still works.'];
  $('stage-state').replaceChildren(card({ heading: 'The projects did not load', text, error: true, retry: true }));
  $('p-state').replaceChildren(card({ heading: 'The projects did not load', level: 'h3', text, error: true, retry: true }));
  $('stage-note').hidden = true;
  status('The list of projects did not load.', 9000);
}

// ---- Projects available: the key under the photograph, the list view, and the project index -------------------
let more = null;
function render() {
  setState('ready');
  $('stage-state').replaceChildren();
  $('p-state').replaceChildren();
  $('stage-note').hidden = false;
  campus.setProjects(projects);

  // Phone and tablet key: the numbered markers on the photograph match this list.
  $('key').replaceChildren();
  keyButtons = projects.filter(placed).map((p) => {
    const li = make('li'); const b = make('button'); b.type = 'button'; b.dataset.slug = p.slug; b.setAttribute('aria-pressed', 'false');
    b.append(make('span', 'mark', String(p.n)), make('span', '', p.title));
    b.firstChild.setAttribute('aria-hidden', 'true');
    b.addEventListener('click', () => choose(campus.selected === p ? null : p, b));
    li.append(b); $('key').append(li); return b;
  });

  // List view: the same projects, the same actions, no picture needed.
  $('campus-list').replaceChildren(...projects.map((p) => {
    const li = make('li'); li.id = 'list-' + p.slug;
    const h = make('h2'); const n = make('span', 'num', String(p.n)); n.setAttribute('aria-hidden', 'true'); h.append(n, p.title);
    li.append(h, facts(p), actions(p));
    return li;
  }));

  // Open projects: an index with a key plan that follows pointer and focus.
  const keyplan = $('keyplan');
  keyplan.querySelectorAll('.mark').forEach((m) => m.remove());
  const keyMarks = projects.map((p) => {
    if (!placed(p)) return null;
    const pl = plots[p.plot]; const [x, y] = inPicture(pl.x, pl.y, pl.top - 0.35);
    const m = make('span', 'mark', String(p.n)); m.style.left = x * 100 + '%'; m.style.top = y * 100 + '%';
    keyplan.append(m); return m;
  });
  const items = projects.map((p) => {
    const li = make('li', 'p-item'); li.id = anchorFor(p);
    const num = make('span', 'p-num', String(p.n)); num.setAttribute('aria-hidden', 'true');
    const body = make('div', 'p-body');
    body.append(make('h3', '', p.title), facts(p), actions(p));
    const thumb = buildingCrop(p.plot, pictureAlt(p).replace(' on the campus render', ''), { w: 0.2, aspect: 4 / 3 }); thumb.classList.add('p-thumb');
    li.append(num, body, thumb);
    li.addEventListener('pointerenter', () => activate(p)); li.addEventListener('focusin', () => activate(p));
    return li;
  });
  $('p-list').replaceChildren(...items);
  function activate(p) {
    const i = projects.indexOf(p);
    keyMarks.forEach((m, k) => m?.classList.toggle('is-on', k === i));
    items.forEach((li, k) => li.classList.toggle('is-active', k === i));
    $('p-caption').replaceChildren(make('span', 'fig', 'Key plan'), make('b', '', p.n + '  ' + p.title), make('span', '', placed(p) ? ', ' + p.building + '.' : ', building not on the picture yet.'));
  }
  activate(projects[0]);

  // A longer index shows the first six and a button for the rest.
  const FIRST = 6;
  more?.remove(); more = null;
  if (items.length > FIRST) {
    items.slice(FIRST).forEach((li) => { li.hidden = true; });
    more = make('button', 'btn btn-quiet p-more', 'Show all ' + items.length + ' projects'); more.type = 'button';
    more.addEventListener('click', () => {
      items.forEach((li) => { li.hidden = false; });
      more.remove(); more = null;
      const heading = items[FIRST].querySelector('h3'); heading.setAttribute('tabindex', '-1'); heading.focus();
      status('Showing all ' + items.length + ' projects.');
    });
    $('p-list').after(more);
  }

  // How joining works: follow the first project through the three steps.
  const first = projects[0];
  const carries = [...document.querySelectorAll('#joining .carry')];
  ['', 'Still ', 'At '].forEach((prefix, index) => {
    const mark = carries[index]?.querySelector('.mark');
    if (!mark) return;
    mark.hidden = false; mark.textContent = String(first.n);
    mark.nextElementSibling.textContent = prefix + first.title;
  });
}

// ---- A shared link opens its project ------------------------------------------------------------------------------
function openFromHash(arrival) {
  const slug = slugFromHash(location.hash);
  if (!slug) return;
  const p = projects.find((entry) => entry.slug === slug);
  if (!p) { if (arrival) status('That project is not on the Community page right now. The open projects are below.', 9000); return; }
  if (hero.classList.contains('is-list')) setList(false);
  choose(p, null, { focus: false });
  if (!wide.matches) sheet.scrollIntoView({ block: 'start' });
  else hero.scrollIntoView({ block: 'start' });
}
addEventListener('hashchange', () => openFromHash(true));

// ---- Questions ------------------------------------------------------------------------------------------------
$('faq').addEventListener('click', (event) => {
  const b = event.target.closest('.faq-q'); if (!b) return;
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(open)); $(b.getAttribute('aria-controls')).hidden = !open;
});

async function start() {
  showLoading();
  try { projects = await loadProjects(); }
  catch { projects = []; showError(); return; }
  if (!projects.length) { showEmpty(); return; }
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => openFromHash(true)));
}
void start();
