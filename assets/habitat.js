(() => {
  const menu = document.querySelector('.menu-button'), nav = document.querySelector('#navigation');
  menu?.addEventListener('click', () => {const open = menu.getAttribute('aria-expanded') !== 'true';menu.setAttribute('aria-expanded', String(open));nav?.classList.toggle('open', open);});
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {menu.setAttribute('aria-expanded', 'false');nav?.classList.remove('open');menu.focus();}});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const names = { 'hero-film': 'architectural background', 'future-film': 'future habitat', 'research-film': 'research workshop', 'courtyard-film': 'courtyard home', 'cutaway-film': 'cutaway model' };
  document.querySelectorAll('video').forEach(video => {
    const button = video.id === 'hero-film' ? document.querySelector('#film-toggle') : document.querySelector(`[data-film-toggle="${video.id}"]`);
    if (!button) return;
    button.hidden = false;
    let pending = false, requested = false, retry = false, loadTimer;
    const status = document.createElement('span');status.className = 'media-status';status.setAttribute('role', 'status');status.hidden = true;button.after(status);
    function label() {const action = pending && video.paused ? 'Cancel loading' : video.paused ? 'Play' : 'Pause';button.textContent = `${action} ${video.id === 'hero-film' ? 'background film' : 'film'}`;button.setAttribute('aria-label', `${action} ${names[video.id] || 'film'}`);button.setAttribute('aria-pressed', String(!video.paused || pending));}
    function failed() {clearTimeout(loadTimer);pending = requested = false;retry = true;video.pause();status.textContent = 'Video could not load. Please try again.';status.hidden = false;label();}
    async function start(manual) {requested = pending = true;status.hidden = true;if (video.error || retry) {video.load();retry = false;}label();clearTimeout(loadTimer);loadTimer = setTimeout(() => {if (requested && video.readyState < 3) failed();}, 15000);try {await video.play();} catch (error) {if (requested && manual && error.name !== 'AbortError') failed();} finally {pending = false;label();}}
    button.addEventListener('click', () => {if (pending || !video.paused) {requested = pending = false;video.pause();label();} else start(true);});
    ['play', 'playing', 'pause', 'ended'].forEach(event => video.addEventListener(event, () => {if (event !== 'play') clearTimeout(loadTimer);label();}));
    video.addEventListener('error', () => {if (requested) failed();});
    reduce.addEventListener('change', event => {if (event.matches) {requested = pending = false;video.pause();label();}});
    label();if (video.id === 'hero-film' && !reduce.matches && !navigator.connection?.saveData) start(false);
  });
  const result = document.querySelector('#scenario-result');
  document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {const work = button.dataset.scenario === 'work';document.querySelectorAll('[data-scenario]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));document.querySelector('.work-area').hidden = !work;result.textContent = work ? 'Changed brief: add a work area. Architects and engineers would reassess privacy, circulation, resources and the construction approach before any change.' : 'Initial brief: two private rooms and a shared space. Access, privacy and resource needs require evaluation.';}));
  if (!reduce.matches && 'IntersectionObserver' in window) {const observer = new IntersectionObserver(entries => entries.forEach(e => {if (e.isIntersecting) {e.target.classList.add('revealed');observer.unobserve(e.target);}}), { threshold: .05 });document.querySelectorAll('.section-heading,.tool-card,.research-table article').forEach(e => {e.classList.add('reveal');observer.observe(e);});}
})();
