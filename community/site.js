// Page chrome shared by the Community page and the home page campus section: the header menu (Community page),
// the status message and the Motion switch.
export function statusWriter(id = 'status') {
  let timer = 0;
  return (text, keep = 5200) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    clearTimeout(timer);
    if (text && keep) timer = setTimeout(() => { el.textContent = ''; }, keep);
  };
}

export function initMenu() {
  const header = document.querySelector('.site-header');
  const menu = header?.querySelector('.menu-button');
  if (!menu) return;
  menu.addEventListener('click', () => {
    const open = !header.classList.contains('is-open');
    header.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
  });
}

// Motion: on by default, off when the visitor asks for reduced motion or switches it off here.
export function initMotion(button, onChange, status) {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const apply = (on, why) => {
    root.classList.toggle('moving', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', 'Motion ' + (on ? 'on' : 'off'));
    onChange?.(on, why);
  };
  button.addEventListener('click', () => {
    const on = !root.classList.contains('moving');
    try { localStorage.setItem('bg-motion', on ? 'on' : 'off'); } catch { /* fine without it */ }
    apply(on, 'button');
    status?.(on ? 'Motion on.' : 'Motion off. The campus and page stay still.');
  });
  reduced.addEventListener('change', () => { if (reduced.matches) apply(false, 'system'); });
  apply(root.classList.contains('moving'), 'start');
  return () => root.classList.contains('moving');
}
