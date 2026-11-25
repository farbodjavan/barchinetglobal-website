import { Three, addBlock, createModelViewer, materials } from '../../assets/model-viewer.mjs?v=2';
import { dayStates } from '../../assets/scene-kit.mjs?v=2';
import { drawPlan, bindPlan, polygonArea } from '../../assets/plan-kit.mjs?v=1';
import { loadGlb } from '../../assets/glb-lite.mjs?v=1';
import { studio, toWorld, roomCentre, H } from './studio-data.mjs?v=1';

const $ = selector => document.querySelector(selector);
const here = new URL('.', import.meta.url);

/* ---------- Stand-in model, built from the same data as the plan ---------- */
function buildStandIn() {
  const root = new Three.Group(), roof = new Three.Group(), [ox, oz] = studio.origin;
  roof.name = 'Roof';
  const skin = { plaster: materials.plaster('#efe9dc'), garden: materials.plaster('#e2d8c4'), timber: materials.timber('#b98a54'), dark: materials.timber('#6f4b2e'), stone: materials.stone('#a9a79c'), concrete: materials.concrete('#bdb9ae'), fabric: materials.fabric('#7f8f86'), paint: materials.paint('#f4f4f0'), glass: materials.glass(), frame: materials.metal('#3a4144'), leaf: materials.foliage('#5f8050'), floor: materials.timber('#c9a678'), tile: materials.stone('#cfd2cc'), paving: materials.stone('#b7b2a4') };
  const along = (w, y0, y1, material, parent = root, t = w.t) => { // a box following a plan segment between two heights
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, length = Math.hypot(dx, dy);
    const mesh = addBlock(parent, material, [length, y1 - y0, t], [(w.x1 + w.x2) / 2 + ox, (y0 + y1) / 2, (w.y1 + w.y2) / 2 + oz]);
    mesh.rotation.y = -Math.atan2(dy, dx);
    return mesh;
  };
  for (const wall of studio.walls) along(wall, 0, wall.h ?? H, wall.h ? skin.garden : skin.plaster);
  for (const win of studio.windows) {
    if (win.sill > 0) along(win, 0, win.sill, skin.plaster);
    along(win, win.head, H, skin.plaster);
    const glass = along(win, win.sill, win.head, skin.glass, root, .03); glass.castShadow = false;
    along(win, win.sill, win.sill + .06, skin.frame, root, .09); along(win, win.head - .06, win.head, skin.frame, root, .09);
    const dx = win.x2 - win.x1, dy = win.y2 - win.y1, length = Math.hypot(dx, dy), bars = Math.max(1, Math.round(length / 1.1));
    for (let i = 0; i <= bars; i++) { const k = i / bars, x = win.x1 + dx * k, y = win.y1 + dy * k; addBlock(root, skin.frame, [.06, win.head - win.sill, .09], [x + ox, (win.sill + win.head) / 2, y + oz]).rotation.y = -Math.atan2(dy, dx); }
  }
  for (const d of studio.doors) { // head above each door opening
    const a = d.along * Math.PI / 180, seg = { x1: d.x, y1: d.y, x2: d.x + Math.cos(a) * d.w, y2: d.y + Math.sin(a) * d.w, t: d.y > 9 ? .25 : d.along ? .15 : .25 };
    if (d.y < 9) along(seg, 2.1, H, skin.plaster);
  }
  // floors: a room slab per room, paving in the courtyard
  for (const room of studio.rooms) {
    const xs = room.poly.map(p => p[0]), ys = room.poly.map(p => p[1]), w = Math.max(...xs) - Math.min(...xs) + .3, d = Math.max(...ys) - Math.min(...ys) + .3;
    addBlock(root, room.id === 'courtyard' ? skin.paving : room.hatch === 'tile' ? skin.tile : skin.floor, [w, .12, d], [(Math.min(...xs) + Math.max(...xs)) / 2 + ox, -.06 + (room.id === 'courtyard' ? -.02 : 0), (Math.min(...ys) + Math.max(...ys)) / 2 + oz]).castShadow = false;
  }
  for (const item of studio.furniture) {
    if (item.type === 'rect') addBlock(root, skin[item.material] || skin.timber, [item.w, item.height, item.h], [item.x + item.w / 2 + ox, item.height / 2, item.y + item.h / 2 + oz]);
    else if (item.type === 'circle') { const mesh = new Three.Mesh(new Three.CylinderGeometry(item.r, item.r * .8, item.height, 20), skin.paint); mesh.position.set(item.x + ox, item.height / 2, item.y + oz); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); }
    else if (item.type === 'tree') {
      const trunk = new Three.Mesh(new Three.CylinderGeometry(.09, .14, item.height * .55, 10), skin.dark); trunk.position.set(item.x + ox, item.height * .275, item.y + oz); trunk.castShadow = true; root.add(trunk);
      for (const [dx, dy, dz, r] of [[0, .78, 0, 1], [.5, .66, .3, .72], [-.45, .7, -.25, .76], [.1, .92, -.35, .6], [-.2, .6, .5, .62]]) { const crown = new Three.Mesh(new Three.IcosahedronGeometry(item.r * r, 2), skin.leaf); crown.position.set(item.x + ox + dx * item.r, item.height * dy, item.y + oz + dz * item.r); crown.castShadow = crown.receiveShadow = true; root.add(crown); }
    }
  }
  // lamp over the desk, a few books on the shelf: small things that give the room a sense of size
  for (let i = 0; i < 7; i++) addBlock(root, [skin.fabric, skin.dark, skin.paint][i % 3], [.2, .24 + (i % 3) * .04, .05 + (i % 2) * .02], [6.67 + ox, 1.2 + (i > 3 ? .5 : 0), 2.3 + (i % 4) * .28 + oz]);
  // roof slab with a timber soffit and a deeper overhang towards the courtyard
  addBlock(roof, skin.concrete, [11, .18, 7], [0, H + .2, 3 + oz]);
  addBlock(roof, skin.timber, [10.9, .08, 6.9], [0, H + .06, 3 + oz]);
  for (const x of [-5.3, 5.3]) addBlock(roof, skin.dark, [.12, .3, 7], [x, H + .15, 3 + oz]);
  root.add(roof);
  return { root, roof: [roof] };
}

/* ---------- Page ---------- */
async function init() {
  const stageEl = $('#studio-stage'), status = $('#studio-status'), source = $('#model-source'), planBox = $('#studio-plan'), roofButton = $('#roof-toggle');
  let manifest = { ready: false, states: {}, cutaway: ['roof', 'ceiling'] };
  try { const response = await fetch(new URL('manifest.json', here)); if (response.ok) manifest = { ...manifest, ...(await response.json()) }; } catch { /* the stand-in works without a manifest */ }
  const rooms = manifest.rooms || studio.rooms, origin = manifest.planOrigin || studio.origin;
  let time = 'afternoon', selectedRoom = null, roofParts = [], roofHidden = false, baked = false, loadToken = 0, viewer = null;

  const say = text => { status.textContent = text; };
  const hotspotList = anchors => (manifest.hotspots || studio.hotspots).map(spot => {
    const fallback = spot.at ? toWorld(spot.at[0], spot.at[2], spot.at[1], origin) : [0, 1.5, 0];
    return { label: spot.label, text: spot.text, view: spot.view && { ...spot.view, target: anchors?.[spot.anchor] || fallback }, position: anchors?.[spot.anchor] || fallback };
  });

  function renderPlan() {
    const underlay = manifest.plan?.ready && $('#plan-rendered')?.getAttribute('aria-pressed') === 'true';
    planBox.innerHTML = drawPlan({ ...studio, rooms }, { selected: selectedRoom, selectable: true });
    if (underlay) { // rendered orthographic plan from Blender, placed under the linework by its extent in metres
      const [x0, y0, x1, y1] = manifest.plan.bounds || studio.bounds, svg = planBox.querySelector('svg');
      svg.querySelector('.pk-rooms').insertAdjacentHTML('beforebegin', `<image href="${new URL(manifest.plan.image, here)}" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" preserveAspectRatio="none"/>`);
      svg.classList.add('pk-over-image');
    }
    $('#room-list').innerHTML = rooms.map(room => `<li><button type="button" data-room="${room.id}" aria-pressed="${room.id === selectedRoom}"><span>${room.number}</span>${room.name}<small>${(room.area ?? polygonArea(room.poly)).toFixed(1)} m²</small></button></li>`).join('');
  }
  function setRoof(hidden, announce = true) {
    roofHidden = hidden;
    for (const part of roofParts) part.visible = !hidden;
    roofButton.setAttribute('aria-pressed', String(hidden)); roofButton.textContent = hidden ? 'Show roof' : 'Hide roof';
    viewer?.refreshLighting();
    if (announce) say(hidden ? 'Roof hidden. You are looking into the rooms from above.' : 'Roof shown.');
  }
  function selectRoom(id, focusPlan) {
    const room = rooms.find(r => r.id === id); if (!room) return;
    selectedRoom = id; renderPlan();
    if (focusPlan) planBox.querySelector(`[data-room="${id}"]`)?.focus({ preventScroll: true });
    if (!viewer) { say(`${room.name} selected. The 3D view is not available in this browser.`); return; }
    const [cx, cy] = roomCentre(room);
    if (room.id !== 'courtyard' && !roofHidden) setRoof(true, false);
    viewer.flyTo({ ...(room.view || { azimuth: 2.6, elevation: .95, distance: .6 }), target: toWorld(cx, cy, 1.1, origin) });
    say(`${room.name}: camera moved${room.id !== 'courtyard' ? ', roof hidden' : ''}.`);
  }

  /* 3D or fallback */
  viewer = createModelViewer(stageEl, {
    enablePan: true, time, groundColor: '#b9b3a2', home: { azimuth: .62, elevation: .38, distance: 1.12 },
    purpose: 'A small courtyard studio. Change the time of day and watch where the light lands.',
    tips: ['Drag to turn, scroll or pinch to zoom', 'Pick a time of day at the top', 'Hide the roof, or pick a room on the plan', 'Keys: arrows turn, + and − zoom, 0 resets'],
    storageKey: 'barchinet.hint.daylight',
    onTimeChange: key => { time = key; syncTimeButtons(); if (baked) loadBaked(key); },
    onError: showFallback,
  });

  function showStandIn() {
    baked = false;
    const built = buildStandIn(); roofParts = built.roof;
    viewer.showGround(true);
    viewer.replace(built.root, { size: 8.6, center: 1.1, hotspots: hotspotList() });
    setRoof(roofHidden, false);
    source.dataset.kind = 'standin';
    source.textContent = 'Stand-in model: simple shapes with real-time sun and shadows. The baked, path-traced model has not been installed yet.';
    $('#view-kind').textContent = 'Stand-in geometry · real-time light, not baked';
  }
  async function loadBaked(key) {
    const entry = manifest.states?.[key]; if (!entry?.model) return showStandIn();
    const token = ++loadToken; stageEl.classList.add('is-loading'); say(`Loading the ${dayStates[key].label.toLowerCase()} model…`);
    try {
      const result = await loadGlb(new URL(entry.model, here));
      if (token !== loadToken) return;
      const size = result.box.getSize(new Three.Vector3()), prefixes = (manifest.cutaway || []).map(p => p.toLowerCase());
      roofParts = []; result.scene.traverse(node => { if (prefixes.some(p => node.name.toLowerCase().startsWith(p))) roofParts.push(node); });
      baked = true; viewer.showGround(!manifest.modelHasGround);
      viewer.replace(result.scene, { size: Math.max(size.x, size.z) * .62, center: Math.min(1.4, size.y * .4), hotspots: hotspotList(result.anchors) });
      setRoof(roofHidden, false);
      source.dataset.kind = 'baked';
      source.textContent = `Baked model, ${dayStates[key].label.toLowerCase()} light. Light and shadow were path-traced in Blender and stored in the textures; the browser only displays them.`;
      $('#view-kind').textContent = 'Baked light · fixed to four times of day';
      say(`${dayStates[key].label} light loaded.`);
    } catch (error) {
      if (token !== loadToken) return;
      console.error(error);
      showStandIn(); say('');
      source.dataset.kind = 'error';
      source.textContent = `The baked model could not be shown (${error.message}) The stand-in model is displayed instead.`;
    } finally { if (token === loadToken) stageEl.classList.remove('is-loading'); }
  }

  function showFallback() { // no WebGL: rendered stills if installed, otherwise the plan carries the page
    viewer = null;
    $('#studio-3d').classList.add('no-3d');
    for (const button of document.querySelectorAll('[data-view-action]')) button.disabled = true;
    const box = $('#studio-fallback'); box.hidden = false;
    const draw = () => {
      const still = manifest.ready && manifest.states?.[time]?.still;
      box.querySelector('.fallback-picture').innerHTML = still
        ? `<img src="${new URL(still, here)}" alt="Rendered view of the studio in ${dayStates[time].label.toLowerCase()} light" width="1920" height="1080">`
        : `<p><strong>3D is not available in this browser.</strong> The plan beside this panel still works: pick a room to read its size. Rendered pictures for each time of day will appear here once they are installed.</p>`;
      for (const button of box.querySelectorAll('[data-fallback-time]')) button.setAttribute('aria-pressed', String(button.dataset.fallbackTime === time));
    };
    box.querySelector('.fallback-times').innerHTML = Object.entries(dayStates).map(([key, s]) => `<button type="button" data-fallback-time="${key}">${s.label}</button>`).join('');
    for (const button of box.querySelectorAll('[data-fallback-time]')) button.onclick = () => { time = button.dataset.fallbackTime; draw(); say(`${dayStates[time].label} selected.`); };
    draw();
    source.textContent = '3D graphics are unavailable in this browser.';
  }
  const syncTimeButtons = () => { $('#time-readout').textContent = `${dayStates[time].label}, about ${dayStates[time].hour}`; };

  const actions = {
    roof: () => setRoof(!roofHidden),
    reset: () => { selectedRoom = null; renderPlan(); viewer?.fitView(); say('View reset.'); },
    top: () => { if (!roofHidden) setRoof(true, false); viewer?.top(); say('Looking straight down with the roof hidden. Compare with the plan.'); },
    in: () => viewer?.zoom(1.25), out: () => viewer?.zoom(1 / 1.25),
  };
  for (const button of document.querySelectorAll('[data-view-action]')) button.onclick = () => actions[button.dataset.viewAction]();
  bindPlan(planBox, id => selectRoom(id, true));
  $('#room-list').addEventListener('click', event => { const button = event.target.closest('[data-room]'); if (button) { selectRoom(button.dataset.room); $(`#room-list [data-room="${button.dataset.room}"]`)?.focus({ preventScroll: true }); } });
  const rendered = $('#plan-rendered');
  if (manifest.plan?.ready) { rendered.hidden = false; rendered.onclick = () => { rendered.setAttribute('aria-pressed', String(rendered.getAttribute('aria-pressed') !== 'true')); renderPlan(); }; }
  renderPlan(); syncTimeButtons();
  if (viewer) { if (manifest.ready) await loadBaked(time); else showStandIn(); }
  document.documentElement.classList.add('studio-ready');
}

init().catch(error => { console.error(error); document.documentElement.classList.add('module-failed'); });
