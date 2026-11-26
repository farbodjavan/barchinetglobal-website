// The campus section of the home page: the same photograph and callouts as the Barchinet Campus page, as links to each
// project there (on campus.barchinetglobal.com). Projects come from the public list; with none yet, the picture stays and says so honestly.
import { mountCampus } from './campus-stage.js';
import { initMotion, statusWriter } from './site.js';
import { anchorFor, campusSite, joinDestination, loadProjects, signedIn } from './community-data.js';

const $ = (id) => document.getElementById(id);
const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const section = $('community-section');
if (section) {
  const stage = $('cc-stage');
  const status = statusWriter('cc-status');
  const hrefFor = (p) => campusSite + '/#' + anchorFor(p);
  const campus = mountCampus(stage, {
    projects: [], kind: 'link', hrefFor,
    // The picture is fitted whole by the stage; on small stages only the numbered markers are shown.
    frame: (w) => ({ compact: w < 700 }),
    onStatus: (text) => status(text),
  });
  initMotion($('cc-motion'), (on) => campus.setMotion(on), status);

  const LIGHT_NAMES = { morning: 'Morning', day: 'Day', sunset: 'Sunset', night: 'Night' };
  const lightButtons = [...section.querySelectorAll('.light .seg')];
  lightButtons.forEach((b) => b.addEventListener('click', () => {
    const actual = campus.setLight(b.dataset.light);
    lightButtons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    status('Light: ' + (b.dataset.light === 'auto' ? 'Auto, ' + LIGHT_NAMES[actual].toLowerCase() + ' by your clock' : LIGHT_NAMES[actual]) + '. A colour grade, not a final render.');
  }));

  const state = $('cc-state');
  const actions = $('cc-actions');
  const note = (strong, text, links) => {
    const box = make('div', 'cc-state');
    box.append(make('strong', '', strong), make('p', '', text));
    if (links) box.append(links);
    return box;
  };
  const show = (pick) => { actions.querySelectorAll('[data-pick-link]').forEach((a) => { a.hidden = !pick; }); actions.querySelectorAll('[data-empty-link]').forEach((a) => { a.hidden = pick; }); };
  state.replaceChildren(make('p', 'cc-loading', 'Loading the open projects…'));
  void signedIn().then((member) => {
    if (member) actions.querySelectorAll('[data-join-community]').forEach((a) => { a.href = joinDestination(null); });
  });
  loadProjects().then((projects) => {
    if (!projects.length) {
      show(false);
      state.replaceChildren(note('Projects open here soon', 'No project is open to join yet. Each project that opens gets a building on this campus. Joining is always free.'));
      return;
    }
    show(true);
    state.replaceChildren();
    campus.setProjects(projects);
    // Phone key: the numbered markers, as links.
    $('cc-key').replaceChildren(...projects.filter((p) => p.plot !== null).map((p) => {
      const li = make('li'); const a = make('a'); a.href = hrefFor(p);
      const n = make('span', 'mark', String(p.n)); n.setAttribute('aria-hidden', 'true');
      a.append(n, p.title); li.append(a); return li;
    }));
  }).catch(() => {
    show(false);
    state.replaceChildren(note('The projects did not load', 'Check your connection and reload the page. The Community page and joining still work.'));
  });
}
