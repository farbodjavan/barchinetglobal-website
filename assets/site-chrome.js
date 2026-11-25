/* Shared Barchinet Global chrome. No tracking, no storage, no network requests.
   - Pages that already carry the main site header keep it (their nav and footer are static HTML).
   - Every other public page (Research Labs apps, policy pages) gets the slim global bar
     and the same footer, so a visitor can always get back to the rest of the site.
   Opt out per page with <html data-chrome="none"> (used by full-screen experiences). */
(() => {
  const root = document.documentElement;
  if (root.dataset.chrome === 'none' || document.querySelector('.bgc-bar')) return;
  const path = location.pathname;
  const links = [
    ['/workspace/', 'Workspace'], ['/tools/', 'Tools'], ['/education/research-labs/', 'Research Labs'],
    ['/research/', 'Research'], ['/future-habitats/', 'Future Habitats'], ['/about/', 'About / Contact'],
  ];
  const current = href => path.startsWith(href) ? ' aria-current="page"' : '';
  const footerHtml = `<div class="bgc-footer-grid"><div class="bgc-footer-brand"><a href="/" aria-label="Barchinet Global home"><img src="/assets/barchinet-global-logo.svg" alt="Barchinet Global" width="900" height="230" loading="lazy"></a><p>A habitat design ecosystem, from Earth to space</p></div><nav aria-label="Explore"><h2>Explore</h2><ul><li><a href="/workspace/">Workspace</a></li><li><a href="/tools/">Tools</a></li><li><a href="/education/research-labs/">Research Labs</a></li><li><a href="/research/">Research</a></li><li><a href="/future-habitats/">Future Habitats</a></li></ul></nav><nav aria-label="Company"><h2>Company</h2><ul><li><a href="/about/">About</a></li><li><a href="/about/#contact">Contact</a></li><li><a href="/releases/">Project updates</a></li><li><a href="/persian-pattern/">Persian Pattern</a></li></ul></nav><nav aria-label="Privacy"><h2>Privacy</h2><ul><li><a href="/website-privacy.html">Website privacy</a></li><li><a href="/privacy.html">App privacy policies</a></li></ul></nav></div><div class="bgc-footer-base"><p>© 2026 Barchinet Inc.</p><p>Research Labs prototypes use synthetic sample data.</p></div>`;

  function mount() {
    if (!document.querySelector('.site-header')) {
      const bar = document.createElement('nav');
      bar.className = 'bgc-bar';
      bar.setAttribute('aria-label', 'Barchinet Global');
      bar.innerHTML = `<a class="bgc-home" href="/"><img src="/assets/barchinet-symbol.svg" alt="" width="18" height="18">Barchinet Global</a><button class="bgc-toggle" type="button" aria-expanded="false" aria-controls="bgc-links">Site menu <span aria-hidden="true">☰</span></button><ul class="bgc-links" id="bgc-links">${links.map(([href, label]) => `<li><a href="${href}"${current(href)}>${label}</a></li>`).join('')}</ul>`;
      const skip = document.querySelector('a.skip, a[href="#main"]');
      if (skip && skip.parentElement === document.body) skip.after(bar); else document.body.prepend(bar);
      const toggle = bar.querySelector('.bgc-toggle');
      const set = open => { bar.classList.toggle('bgc-open', open); toggle.setAttribute('aria-expanded', String(open)); };
      toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
      bar.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); } });
    }
    if (!document.querySelector('.bgc-footer')) {
      const footer = document.createElement('footer');
      footer.className = 'bgc-footer';
      footer.id = 'site-footer';
      footer.innerHTML = footerHtml;
      document.body.append(footer);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
