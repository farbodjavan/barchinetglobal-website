/* Web calculators for the four tool pages: purpose -> inputs -> result -> next step.
   Runs entirely in the page: no storage, no network. Inputs can be shared through the URL query.
   These are separate from the Android apps and use ideal geometry only. */
(() => {
  'use strict';
  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
  const num = (label, unit, value, extra = {}) => ({ type: 'number', label, unit, value, min: 0, ...extra });
  const TOOLS = {
    'tank-volume': {
      title: 'Tank Volume', purpose: 'How much does the tank hold, and how long until it is full?',
      fields: {
        shape: { type: 'choice', label: 'Tank shape', value: 'rect', options: [['rect', 'Rectangular'], ['cyl', 'Upright cylinder']] },
        length: num('Internal length', 'm', 2, { when: v => v.shape === 'rect' }),
        width: num('Internal width', 'm', 1, { when: v => v.shape === 'rect' }),
        diameter: num('Internal diameter', 'm', 1.2, { when: v => v.shape === 'cyl' }),
        height: num('Internal height', 'm', 1),
        level: num('Liquid level', '%', 50, { max: 100, zero: true }),
        flow: num('Net fill rate', 'L/min', 25, { optional: true, hint: 'Optional. Leave empty to skip the time estimate.' }),
      },
      compute(v) {
        const area = v.shape === 'rect' ? v.length * v.width : Math.PI * (v.diameter / 2) ** 2;
        const capacity = area * v.height * 1000, liquid = capacity * v.level / 100, space = capacity - liquid;
        const rows = [['Capacity', fmt(capacity, 0) + ' L'], ['Remaining space', fmt(space, 0) + ' L']];
        if (v.flow) rows.push(['Time to fill at ' + fmt(v.flow) + ' L/min', space <= 0 ? 'Already full' : fmt(space / v.flow, 1) + ' min']);
        return {
          primary: ['Liquid volume', fmt(liquid, 0), 'L'], rows,
          working: [v.shape === 'rect' ? `Base area ${fmt(v.length)} × ${fmt(v.width)} = ${fmt(area, 3)} m²` : `Base area π × (${fmt(v.diameter)} ÷ 2)² = ${fmt(area, 3)} m²`, `Capacity ${fmt(area, 3)} × ${fmt(v.height)} = ${fmt(area * v.height, 3)} m³ = ${fmt(capacity, 0)} L`, `Liquid ${fmt(capacity, 0)} × ${fmt(v.level)}% = ${fmt(liquid, 0)} L`],
        };
      },
      limits: 'Ideal internal geometry and a constant net flow rate. Wall thickness, changing pressure, pump curves and obstructions are not modelled.',
      next: ['/tools/concrete-estimate/', 'Concrete Estimate'],
    },
    'concrete-estimate': {
      title: 'Concrete Estimate', purpose: 'How much concrete does the pad need, with an allowance?',
      fields: {
        shape: { type: 'choice', label: 'Pad shape', value: 'rect', options: [['rect', 'Rectangular'], ['round', 'Round']] },
        length: num('Length', 'm', 4, { when: v => v.shape === 'rect' }),
        width: num('Width', 'm', 3, { when: v => v.shape === 'rect' }),
        diameter: num('Diameter', 'm', 3, { when: v => v.shape === 'round' }),
        thickness: num('Thickness', 'm', 0.1),
        reserve: num('Reserve allowance', '%', 10, { max: 50, zero: true }),
        bag: num('Bag yield', 'L per bag', '', { optional: true, hint: 'Optional. Use the yield printed on your product.' }),
        price: num('Unit price', 'per m³', '', { optional: true, hint: 'Optional. Any currency.' }),
      },
      compute(v) {
        const area = v.shape === 'rect' ? v.length * v.width : Math.PI * (v.diameter / 2) ** 2;
        const net = area * v.thickness, total = net * (1 + v.reserve / 100);
        const rows = [['Net volume', fmt(net, 3) + ' m³'], ['Reserve', fmt(total - net, 3) + ' m³']];
        if (v.bag) rows.push(['Bags at ' + fmt(v.bag) + ' L each', fmt(Math.ceil(total * 1000 / v.bag - 1e-9), 0) + ' bags']);
        if (v.price) rows.push(['Material cost', fmt(total * v.price, 2)]);
        return { primary: ['Volume including allowance', fmt(total, 2), 'm³'], rows, working: [v.shape === 'rect' ? `${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} = ${fmt(net, 3)} m³` : `π × (${fmt(v.diameter)} ÷ 2)² × ${fmt(v.thickness)} = ${fmt(net, 3)} m³`, `${fmt(net, 3)} m³ + ${fmt(v.reserve)}% = ${fmt(total, 3)} m³`] };
      },
      limits: 'A quantity estimate, not structural design. Bag yield and prices must match the product and supplier; waste and site conditions vary.',
      next: ['/tools/metal-weight/', 'Metal Weight'],
    },
    'metal-weight': {
      title: 'Metal Weight', purpose: 'What does this piece of stock weigh?',
      fields: {
        shape: { type: 'choice', label: 'Stock shape', value: 'plate', options: [['plate', 'Plate'], ['round', 'Round bar'], ['square', 'Square bar']] },
        width: num('Width', 'mm', 1000, { when: v => v.shape === 'plate' }),
        thickness: num('Thickness', 'mm', 10, { when: v => v.shape === 'plate' }),
        diameter: num('Diameter', 'mm', 20, { when: v => v.shape === 'round' }),
        side: num('Side', 'mm', 20, { when: v => v.shape === 'square' }),
        length: num('Length', 'm', 1),
        quantity: num('Quantity', 'pieces', 1, { step: 1, integer: true }),
        density: num('Density', 'kg/m³', 7850, { hint: 'Assumed value. 7,850 is the example density used on this page; enter the value for your alloy.' }),
        price: num('Price', 'per kg', '', { optional: true, hint: 'Optional. Any currency.' }),
      },
      compute(v) {
        const section = v.shape === 'plate' ? v.width * v.thickness : v.shape === 'round' ? Math.PI * (v.diameter / 2) ** 2 : v.side ** 2; // mm²
        const each = section / 1e6 * v.length * v.density, total = each * v.quantity;
        const rows = [['Weight per piece', fmt(each, 2) + ' kg'], ['Cross-section', fmt(section, 1) + ' mm²']];
        if (v.price) rows.push(['Material cost', fmt(total * v.price, 2)]);
        return { primary: ['Total weight', fmt(total, 2), 'kg'], rows, working: [`Section ${fmt(section, 1)} mm² = ${fmt(section / 1e6, 6)} m²`, `${fmt(section / 1e6, 6)} m² × ${fmt(v.length)} m × ${fmt(v.density, 0)} kg/m³ = ${fmt(each, 2)} kg`, `${fmt(each, 2)} kg × ${fmt(v.quantity, 0)} = ${fmt(total, 2)} kg`] };
      },
      limits: 'Ideal dimensions and assumed density. Manufacturing tolerances, coatings and fittings affect actual weight; this does not assess load capacity.',
      next: ['/tools/stair-geometry/', 'Stair Geometry'],
    },
    'stair-geometry': {
      title: 'Stair Geometry', purpose: 'What riser height and run does this straight flight give?',
      fields: {
        rise: num('Floor-to-floor rise', 'mm', 2800),
        risers: num('Number of risers', 'risers', 16, { step: 1, integer: true, min: 2 }),
        tread: num('Tread depth (going)', 'mm', 280),
      },
      compute(v) {
        const riser = v.rise / v.risers, goings = v.risers - 1, run = goings * v.tread, pitch = Math.atan2(v.rise, run) * 180 / Math.PI;
        return { primary: ['Riser height', fmt(riser, 1), 'mm'], rows: [['Goings', fmt(goings, 0)], ['Horizontal run', fmt(run / 1000, 2) + ' m'], ['Pitch of the flight', fmt(pitch, 1) + '°']], working: [`${fmt(v.rise, 0)} mm ÷ ${fmt(v.risers, 0)} risers = ${fmt(riser, 1)} mm`, `${fmt(goings, 0)} goings × ${fmt(v.tread, 0)} mm = ${fmt(run, 0)} mm`, `Pitch = atan(${fmt(v.rise, 0)} ÷ ${fmt(run, 0)}) = ${fmt(pitch, 1)}°`] };
      },
      limits: 'Geometry only. It does not approve compliance, headroom, landings, accessibility or structure. Check the rules for the project location.',
      next: ['/tools/tank-volume/', 'Tank Volume'],
    },
  };


  const box = 'viewBox="0 0 320 200" role="img"';
  const dimText = (x, y, t, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
  const fit = (w, h, maxW = 220, maxH = 130) => Math.min(maxW / w, maxH / h);
  const DRAW = {
    'tank-volume'(v) {
      const w = v.shape === 'rect' ? v.length : v.diameter, k = fit(w, v.height), W = w * k, Hh = v.height * k, x = 160 - W / 2, y = 165 - Hh, lv = Hh * v.level / 100, r = v.shape === 'cyl' ? Math.min(14, W / 6) : 0;
      return `<svg ${box} aria-label="Side view of the tank filled to ${fmt(v.level)} percent"><rect class="d-fill" x="${x}" y="${165 - lv}" width="${W}" height="${lv}"/><path class="d-line" d="M${x} ${y}V165H${x + W}V${y}"/>${r ? `<ellipse class="d-thin" cx="160" cy="${y}" rx="${W / 2}" ry="${r / 2}"/>` : `<path class="d-thin" d="M${x} ${y}H${x + W}"/>`}<path class="d-thin" d="M${x} ${165 - lv}H${x + W}"/><path class="d-dim" d="M${x} 180H${x + W}M${x} 176v8M${x + W} 176v8M${x - 14} ${y}V165M${x - 18} ${y}h8M${x - 18} 165h8"/>${dimText(160, 195, (v.shape === 'rect' ? fmt(v.length) + ' × ' + fmt(v.width) : 'Ø ' + fmt(v.diameter)) + ' m')}${dimText(x - 20, y + Hh / 2 + 4, fmt(v.height) + ' m', 'end')}${dimText(x + W + 8, 165 - lv + 4, fmt(v.level) + '%', 'start')}</svg>`;
    },
    'concrete-estimate'(v) {
      const w = v.shape === 'rect' ? v.length : v.diameter, d = v.shape === 'rect' ? v.width : v.diameter, k = fit(w, d, 220, 86), W = w * k, D = d * k, x = 160 - W / 2, y = 20, t = Math.max(4, Math.min(22, v.thickness * k * 3));
      return `<svg ${box} aria-label="Plan and edge view of the pad">${v.shape === 'rect' ? `<rect class="d-fill d-line" x="${x}" y="${y}" width="${W}" height="${D}"/>` : `<circle class="d-fill d-line" cx="160" cy="${y + D / 2}" r="${W / 2}"/>`}<path class="d-dim" d="M${x} ${y + D + 12}H${x + W}M${x} ${y + D + 8}v8M${x + W} ${y + D + 8}v8"/>${dimText(160, y + D + 28, (v.shape === 'rect' ? fmt(v.length) + ' × ' + fmt(v.width) : 'Ø ' + fmt(v.diameter)) + ' m')}<rect class="d-fill d-line" x="${x}" y="${190 - t}" width="${W}" height="${t}"/>${dimText(x + W + 8, 190 - t / 2 + 4, fmt(v.thickness * 1000, 0) + ' mm thick', 'start')}${dimText(x, 190 - t - 6, 'edge view, thickness exaggerated', 'start')}</svg>`;
    },
    'metal-weight'(v) {
      const sw = v.shape === 'plate' ? v.width : v.shape === 'round' ? v.diameter : v.side, sh = v.shape === 'plate' ? v.thickness : sw, k = fit(sw, Math.max(sh, sw / 12), 110, 90), W = sw * k, Hh = Math.max(3, sh * k), cx = 70, cy = 85;
      const L = Math.max(30, Math.min(170, v.length * 34));
      return `<svg ${box} aria-label="Cross-section and length of the stock">${v.shape === 'round' ? `<circle class="d-fill d-line" cx="${cx}" cy="${cy}" r="${W / 2}"/>` : `<rect class="d-fill d-line" x="${cx - W / 2}" y="${cy - Hh / 2}" width="${W}" height="${Hh}"/>`}${dimText(cx, 165, v.shape === 'plate' ? fmt(v.width, 0) + ' × ' + fmt(v.thickness, 1) + ' mm' : (v.shape === 'round' ? 'Ø ' : '□ ') + fmt(sw, 1) + ' mm')}${dimText(cx, 182, 'cross-section')}<rect class="d-fill d-line" x="140" y="${cy - 9}" width="${L}" height="18"/><path class="d-dim" d="M140 ${cy + 26}H${140 + L}M140 ${cy + 22}v8M${140 + L} ${cy + 22}v8"/>${dimText(140 + L / 2, cy + 44, fmt(v.length) + ' m long' + (v.quantity > 1 ? ' × ' + fmt(v.quantity, 0) : ''))}${dimText(140 + L / 2, 182, 'length, not to scale')}</svg>`;
    },
    'stair-geometry'(v) {
      const n = Math.min(40, v.risers), run = (v.risers - 1) * v.tread, k = fit(run || 1, v.rise, 230, 135), r = v.rise / v.risers * k, g = v.tread * k, x0 = 160 - (run * k) / 2, y0 = 168;
      let d = `M${x0} ${y0}`; for (let i = 0; i < n; i++) d += `v${-r}${i < n - 1 ? `h${g}` : ''}`;
      const top = y0 - r * n, end = x0 + g * (n - 1);
      return `<svg ${box} aria-label="Side view of the flight with ${fmt(v.risers, 0)} risers"><path class="d-fill" d="${d}V${y0}Z"/><path class="d-line" d="${d}h26"/><path class="d-thin" d="M${x0 - 20} ${y0}H${end + 30}"/><path class="d-dash" d="M${x0} ${y0 - r}L${end} ${top}"/><path class="d-dim" d="M${x0} 182H${end}M${x0} 178v8M${end} 178v8M${end + 20} ${y0}V${top}M${end + 16} ${y0}h8M${end + 16} ${top}h8"/>${dimText((x0 + end) / 2, 196, fmt(run / 1000, 2) + ' m run')}${dimText(end + 26, (y0 + top) / 2 + 4, fmt(v.rise / 1000, 2) + ' m', 'start')}</svg>`;
    },
  };
  const PRESETS = {
    'tank-volume': [['Compact 1 × 1 × 1 m', { shape: 'rect', length: 1, width: 1, height: 1, level: 50, flow: 25 }], ['Long 2 × 1 × 1 m', { shape: 'rect', length: 2, width: 1, height: 1, level: 50, flow: 25 }], ['Round Ø 1.5 × 2 m', { shape: 'cyl', diameter: 1.5, height: 2, level: 30, flow: 40 }]],
    'concrete-estimate': [['Garden pad 4 × 3 m', { shape: 'rect', length: 4, width: 3, thickness: .1, reserve: 10 }], ['Path 8 × 1 m', { shape: 'rect', length: 8, width: 1, thickness: .08, reserve: 10 }], ['Round base Ø 2 m', { shape: 'round', diameter: 2, thickness: .15, reserve: 5 }]],
    'metal-weight': [['Plate 1000 × 10 mm', { shape: 'plate', width: 1000, thickness: 10, length: 1, quantity: 1, density: 7850 }], ['Round bar Ø 20, 6 m', { shape: 'round', diameter: 20, length: 6, quantity: 1, density: 7850 }], ['Square bar 40, 3 m × 4', { shape: 'square', side: 40, length: 3, quantity: 4, density: 7850 }]],
    'stair-geometry': [['2.80 m, 16 risers', { rise: 2800, risers: 16, tread: 280 }], ['3.00 m, 17 risers', { rise: 3000, risers: 17, tread: 270 }], ['2.60 m, 15 risers', { rise: 2600, risers: 15, tread: 290 }]],
  };

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  for (const root of document.querySelectorAll('[data-tool-product]')) {
    const id = root.dataset.toolProduct, tool = TOOLS[id];
    if (!tool) continue;
    const query = new URLSearchParams(location.search);
    const values = {};
    for (const [key, field] of Object.entries(tool.fields)) {
      const given = query.get(key);
      values[key] = given !== null && (field.type !== 'choice' || field.options.some(o => o[0] === given)) ? given : String(field.value);
    }
    const fieldHtml = ([key, f]) => f.type === 'choice'
      ? `<fieldset class="tp-field" data-field="${key}"><legend>${esc(f.label)}</legend><div class="tp-choice">${f.options.map(([v, l]) => `<label><input type="radio" name="${id}-${key}" value="${v}" ${values[key] === v ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`
      : `<div class="tp-field" data-field="${key}"><label for="${id}-${key}">${esc(f.label)}${f.optional ? ' <em>optional</em>' : ''}</label><div class="tp-input"><input id="${id}-${key}" type="number" inputmode="decimal" step="${f.step || 'any'}" min="${f.min}" ${f.max ? `max="${f.max}"` : ''} value="${esc(values[key])}" aria-describedby="${id}-${key}-msg"><span aria-hidden="true">${esc(f.unit)}</span></div><p class="tp-msg" id="${id}-${key}-msg">${f.hint ? esc(f.hint) : ''}</p></div>`;
    root.innerHTML = `<div class="visual-heading"><p class="eyebrow">Use it now · web calculator</p><h2>${esc(tool.purpose)}</h2><p>Enter your own values. The result and its working update as you type. This web calculator is separate from the Android app and nothing you enter leaves this page.</p></div>
<div class="tp-bench"><form class="tp-form" novalidate aria-label="${esc(tool.title)} inputs"><h3><span>1</span> Inputs</h3><div class="tp-presets" role="group" aria-label="Start from an example">${PRESETS[id].map((preset, i) => `<button type="button" data-preset="${i}">${esc(preset[0])}</button>`).join('')}</div>${Object.entries(tool.fields).map(fieldHtml).join('')}<button type="button" class="tp-reset">Reset to the example</button></form>
<div class="tp-result"><h3><span>2</span> Result</h3><div class="tp-live" aria-live="polite" aria-atomic="true"></div><p class="tp-limits"><strong>Know the limits.</strong> ${esc(tool.limits)}</p></div>
<div class="tp-next"><h3><span>3</span> Next step</h3><button type="button" class="button tp-copy">Copy result</button><button type="button" class="button tp-link">Copy link to this calculation</button><p class="tp-status" role="status"></p><a class="text-link" href="mailto:farbodjavan@barchinet.com?subject=${id}%20enquiry">Ask about this tool <span aria-hidden="true">↗</span></a><a class="text-link" href="${tool.next[0]}">Next tool: ${esc(tool.next[1])} <span aria-hidden="true">→</span></a><a class="text-link" href="/tools/">All tools <span aria-hidden="true">→</span></a></div></div>`;
    const form = root.querySelector('.tp-form'), live = root.querySelector('.tp-live'), status = root.querySelector('.tp-status');
    let summary = '';
    function read() {
      const raw = {}, parsed = {}, errors = {};
      for (const [key, f] of Object.entries(tool.fields)) {
        if (f.type === 'choice') { raw[key] = parsed[key] = form.querySelector(`[name="${id}-${key}"]:checked`)?.value ?? f.value; continue; }
        raw[key] = form.querySelector(`#${id}-${key}`).value.trim();
      }
      for (const [key, f] of Object.entries(tool.fields)) {
        if (f.type === 'choice') continue;
        const wrap = form.querySelector(`[data-field="${key}"]`), shown = !f.when || f.when(parsed);
        wrap.hidden = !shown;
        let message = '';
        if (shown) {
          const n = Number(raw[key]), min = f.min ?? 0;
          if (raw[key] === '') { if (!f.optional) message = 'Enter a value.'; }
          else if (!Number.isFinite(n)) message = 'Enter a number.';
          else if (f.zero ? n < 0 : n <= 0) message = f.zero ? 'Use zero or more.' : 'Use a value above zero.';
          else if (n < min) message = `Use ${fmt(min)} or more.`;
          else if (f.max && n > f.max) message = `Use ${fmt(f.max)} or less.`;
          else if (f.integer && !Number.isInteger(n)) message = 'Use a whole number.';
          parsed[key] = raw[key] === '' ? 0 : n;
        }
        const input = wrap.querySelector('input'), msg = wrap.querySelector('.tp-msg');
        input.setAttribute('aria-invalid', String(Boolean(message)));
        msg.textContent = message || f.hint || ''; msg.classList.toggle('error', Boolean(message));
        if (message) errors[key] = message;
      }
      return { raw, parsed, errors };
    }
    function update() {
      const { parsed, errors } = read();
      const bad = Object.keys(errors);
      if (bad.length) {
        summary = '';
        live.innerHTML = `<div class="tp-empty"><strong>No result yet</strong><p>${bad.length === 1 ? 'One input needs' : bad.length + ' inputs need'} attention: ${bad.map(k => esc(tool.fields[k].label.toLowerCase())).join(', ')}.</p></div>`;
      } else {
        let out;
        try { out = tool.compute(parsed); } catch (error) { console.error(error); live.innerHTML = '<div class="tp-empty"><strong>The calculation could not run</strong><p>Reset to the example and try again.</p></div>'; summary = ''; return; }
        summary = `${tool.title} — ${out.primary[0]}: ${out.primary[1]} ${out.primary[2]}. ${out.rows.map(r => r[0] + ': ' + r[1]).join('. ')}. Working: ${out.working.join('; ')}. Estimate only. ${tool.limits}`;
        live.innerHTML = `<div class="tp-drawing">${DRAW[id](parsed)}</div><p class="tp-primary-label">${esc(out.primary[0])}</p><p class="tp-primary">${esc(out.primary[1])} <small>${esc(out.primary[2])}</small></p><dl>${out.rows.map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl><details open><summary>Show the working</summary><ol>${out.working.map(w => `<li>${esc(w)}</li>`).join('')}</ol></details>`;
      }
      for (const button of root.querySelectorAll('.tp-copy,.tp-link')) button.disabled = !summary;
      status.textContent = '';
    }
    async function copy(text, done) {
      try { await navigator.clipboard.writeText(text); status.textContent = done; }
      catch { status.textContent = 'Copying is not available in this browser. Select the result text instead.'; }
    }
    form.addEventListener('input', update);
    form.addEventListener('submit', event => event.preventDefault());
    root.querySelector('.tp-reset').onclick = () => {
      for (const [key, f] of Object.entries(tool.fields)) {
        if (f.type === 'choice') form.querySelector(`[name="${id}-${key}"][value="${f.value}"]`).checked = true;
        else form.querySelector(`#${id}-${key}`).value = f.value;
      }
      update(); status.textContent = 'Example values restored.';
    };
    for (const button of root.querySelectorAll('[data-preset]')) button.onclick = () => {
      const [label, preset] = PRESETS[id][Number(button.dataset.preset)];
      for (const [key, f] of Object.entries(tool.fields)) {
        const value = key in preset ? preset[key] : f.optional ? '' : f.value;
        if (f.type === 'choice') form.querySelector(`[name="${id}-${key}"][value="${value}"]`).checked = true;
        else form.querySelector(`#${id}-${key}`).value = value;
      }
      update(); status.textContent = `Example loaded: ${label}.`;
    };
    root.querySelector('.tp-copy').onclick = () => copy(summary, 'Result copied.');
    root.querySelector('.tp-link').onclick = () => {
      const { raw, parsed } = read(), params = new URLSearchParams();
      for (const [key, f] of Object.entries(tool.fields)) if ((!f.when || f.when(parsed)) && raw[key] !== '') params.set(key, raw[key]);
      copy(`${location.origin}${location.pathname}?${params}#calculator`, 'Link copied. It opens this page with the same inputs.');
    };
    update();
  }
})();
