/* Shared Barchinet Global chrome. No tracking and no storage. It asks the site only two things: whether the visitor is
   signed in (/membership/status, the same check the sign-in page makes), so the header's right-hand "Sign in" can be
   replaced by "My account" (the menu has one "Workspace" item, never a second one), and, on Research Labs pages, the
   public Barchinet Campus project list, to link a project to its building.
   - Pages that already carry the main site header (.site-header with #navigation) keep it (static nav and footer).
   - Every other public page (Research Labs apps, policy pages) gets the slim global bar and the same footer, so a
     visitor can always get back to the rest of the site.
   - Full-screen apps opt in to a compact menu button instead with <html data-chrome="compact">; the button goes into
     an element marked data-bgc-slot when the page has one, otherwise it floats in a corner. No footer is added.
   Opt out per page with <html data-chrome="none">. */
(() => {
  const root = document.documentElement;
  const mode = root.dataset.chrome;
  if (mode === 'none' || document.querySelector('.bgc-bar, .bgc-compact')) return;
  const path = location.pathname;
  const campus = 'https://campus.barchinetglobal.com/';
  const workspace = '/workspace/projects/';
  // The menu's "Workspace" opens the workspace. Signed out it opens sign-in first, which then continues to the workspace;
  // once the visitor is known to be signed in, it goes straight there. (/workspace/ is the product page, linked from
  // the pages that describe the product, not from the menu.)
  const workspaceSignIn = '/membership?next=' + encodeURIComponent(workspace);
  // One list, in one order, on every page: the same items as the main site header.
  const links = [
    ['/', 'Home'], [workspaceSignIn, 'Workspace'], [campus, 'Barchinet Campus'], ['/tools/', 'Tools'],
    ['/education/research-labs/', 'Research Labs'], ['/research/', 'Research'], ['/future-habitats/', 'Future Habitats'],
    ['/about/', 'About / Contact'], ['/releases/', 'Project updates'], ['/membership', 'Sign in'],
  ];
  const current = href => (href === '/' ? path === '/' : href.startsWith('/') && path.startsWith(href)) ? ' aria-current="page"' : '';
  const linkItems = links.map(([href, label]) => `<li><a href="${href}"${label === 'Workspace' ? ' data-bgc-workspace' : current(href)}${label === 'Sign in' ? ' data-bgc-account' : ''}>${label}</a></li>`).join('');
  const footerHtml = `<div class="bgc-footer-grid"><div class="bgc-footer-brand"><a href="/" aria-label="Barchinet Global home"><img src="/assets/barchinet-global-logo.svg" alt="Barchinet Global" width="900" height="230" loading="lazy"></a><p>A habitat design ecosystem, from Earth to space</p></div><nav aria-label="Explore"><h2>Explore</h2><ul><li><a href="${workspaceSignIn}" data-bgc-workspace>Workspace</a></li><li><a href="https://campus.barchinetglobal.com/">Barchinet Campus</a></li><li><a href="/tools/">Tools</a></li><li><a href="/education/research-labs/">Research Labs</a></li><li><a href="/research/">Research</a></li><li><a href="/future-habitats/">Future Habitats</a></li></ul></nav><nav aria-label="Company"><h2>Company</h2><ul><li><a href="/about/">About</a></li><li><a href="/about/#contact">Contact</a></li><li><a href="/releases/">Project updates</a></li><li><a href="/contributor-terms.html">Contributor terms</a></li><li><a href="/persian-pattern/">Persian Pattern</a></li></ul></nav><nav aria-label="Privacy"><h2>Privacy</h2><ul><li><a href="/website-privacy.html">Website privacy</a></li><li><a href="/privacy.html">App privacy policies</a></li></ul></nav></div><div class="bgc-footer-base"><p>© 2026 Barchinet Inc.</p><p>Research Labs prototypes use synthetic sample data.</p></div>`;

  // A disclosure: the button shows and hides the list; Escape closes it and returns focus to the button.
  function disclosure(container, toggle, outside) {
    const set = open => { container.classList.toggle('bgc-open', open); toggle.setAttribute('aria-expanded', String(open)); };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    container.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
    });
    if (outside) document.addEventListener('click', event => { if (!container.contains(event.target)) set(false); });
  }

  function mountBar() {
    const bar = document.createElement('nav');
    bar.className = 'bgc-bar';
    bar.setAttribute('aria-label', 'Barchinet Global');
    bar.innerHTML = `<a class="bgc-home" href="/"><img src="/assets/barchinet-symbol.svg" alt="" width="18" height="18">Barchinet Global</a><button class="bgc-toggle" type="button" aria-expanded="false" aria-controls="bgc-links">Site menu <span aria-hidden="true">☰</span></button><ul class="bgc-links" id="bgc-links">${linkItems}</ul>`;
    const skip = document.querySelector('a.skip, a[href="#main"]');
    if (skip && skip.parentElement === document.body) skip.after(bar); else document.body.prepend(bar);
    disclosure(bar, bar.querySelector('.bgc-toggle'));
    return bar;
  }

  // Full-screen apps: one small button that opens the same destinations, so the working space stays as it is.
  function mountCompact() {
    const menu = document.createElement('nav');
    menu.className = 'bgc-compact';
    menu.setAttribute('aria-label', 'Barchinet Global');
    menu.innerHTML = `<button class="bgc-compact-toggle" type="button" aria-expanded="false" aria-controls="bgc-compact-links"><img src="/assets/barchinet-symbol.svg" alt="" width="16" height="16">Barchinet Global <span aria-hidden="true">☰</span></button><div class="bgc-compact-panel" id="bgc-compact-links"><ul class="bgc-compact-list">${linkItems}</ul></div>`;
    const slot = document.querySelector('[data-bgc-slot]');
    if (slot) { menu.classList.add('bgc-in-slot'); slot.append(menu); } else { menu.classList.add('bgc-float'); document.body.append(menu); }
    disclosure(menu, menu.querySelector('.bgc-compact-toggle'), true);
    return menu;
  }

  function mount() {
    const compact = mode === 'compact';
    const nav = compact ? mountCompact() : !document.querySelector('.site-header #navigation') ? mountBar() : null;
    if (!compact && !document.querySelector('.bgc-footer')) {
      const footer = document.createElement('footer');
      footer.className = 'bgc-footer';
      footer.id = 'site-footer';
      footer.innerHTML = footerHtml;
      document.body.append(footer);
    }
    const signedIn = account();
    if (path.startsWith('/education/research-labs/')) campusLinks(nav, signedIn);
  }

  // Signed in (a member, an owner, or a guest account): "Sign in" is replaced by "My account", in this bar or in the
  // main site header; it opens the sign-in page, which shows the account and Sign out. For a member, "Workspace" (menu
  // and footer) goes straight to the workspace instead of through sign-in. A guest account has no workspace, so its
  // "Workspace" keeps going through the sign-in page, which explains that.
  // Any failure leaves "Sign in", which still works (the sign-in page sends a signed-in member on).
  // Resolves to 'member', 'guest' or false.
  async function account() {
    try {
      const response = await fetch('/membership/status', { credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(8000) });
      if (!response.ok) return false;
      const { signedIn, guest } = await response.json();
      const role = signedIn === true ? 'member' : guest === true ? 'guest' : false;
      if (!role) return false;
      if (role === 'member') document.querySelectorAll('a[data-bgc-workspace]').forEach(link => { link.href = workspace; });
      document.querySelectorAll('a[data-bgc-account], .site-header nav a[href="/membership"]').forEach(link => {
        link.href = '/membership';
        link.textContent = 'My account';
      });
      return role;
    } catch { return false; }
  }

  // A Research Labs project that is on Barchinet Campus: a link to its building and, when it is open to join, to joining.
  // The list and its rules are the Campus page's own (community/community-data.js): only shown projects, only public fields.
  async function campusLinks(nav, signedIn) {
    let project;
    try {
      const response = await fetch('/community/api/projects', { headers: { Accept: 'application/json' }, credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(12000) });
      if (!response.ok) return;
      const { projects } = await response.json();
      const here = path.endsWith('/') ? path : path + '/';
      project = Array.isArray(projects) && projects.find(entry => typeof entry?.lab_page === 'string' && entry.lab_page === here
        && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug ?? '') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(entry.id ?? ''));
    } catch { return; }
    if (!project) return;
    const title = typeof project.title === 'string' ? project.title.trim().slice(0, 120) : '';
    const join = '/workspace/projects/?tab=access&project=' + project.id;
    const role = await signedIn;
    const joinHref = role === 'member' ? join : '/membership?' + new URLSearchParams({ next: join });
    const make = (tag, className, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; return node; };
    const see = make('a', 'bgc-campus-see', 'See it on Barchinet Campus');
    see.href = campus + '#project-' + project.slug;
    if (title) see.setAttribute('aria-label', 'See ' + title + ' on Barchinet Campus');
    // Joining is for members: a guest account is not offered it.
    const joining = project.joinable === false || role === 'guest' ? null : make('a', 'bgc-campus-join', 'Join this project');
    if (joining) { joining.href = joinHref; if (title) joining.setAttribute('aria-label', 'Join ' + title); }
    if (nav?.classList.contains('bgc-compact')) {
      // In a full-screen app the two links join the menu, under a heading, instead of taking space on the page.
      const group = make('div', 'bgc-campus-group');
      group.append(make('p', 'bgc-campus-label', 'This project on Barchinet Campus'), see, ...(joining ? [joining] : []));
      nav.querySelector('.bgc-compact-panel').append(group);
      return;
    }
    const strip = make('aside', 'bgc-campus');
    strip.setAttribute('aria-label', 'This project on Barchinet Campus');
    strip.append(make('p', 'bgc-campus-label', 'This project is on Barchinet Campus'), see, ...(joining ? [joining] : []));
    // At the end of the page, just before the footer: the next step after using the app, and nothing above it moves.
    const footer = document.querySelector('.bgc-footer');
    if (footer) footer.before(strip); else document.body.append(strip);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
