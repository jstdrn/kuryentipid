/* Illustrative readings. Household estimates use the separate appliance schedule. */
window.TrendChart = (() => {
  'use strict';
  const profiles = {
    day: {
      labels: ['00–03', '03–06', '06–09', '09–12', '12–15', '15–18', '18–21', '21–24'],
      values: [0.56, 0.39, 0.98, 0.77, 1.34, 1.11, 1.63, 0.88],
      interval: '3-hour interval',
      previous: 'previous interval',
    },
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [9.4, 8.1, 9.2, 10.6, 9.5, 8.3, 6.8],
      interval: 'Day',
      previous: 'previous day',
    },
    month: {
      labels: Array.from({ length: 30 }, (_, i) => 'Day ' + (i + 1)),
      values: [
        7.3, 6.9, 7.8, 8.4, 7.5, 7.1, 8.1, 9.3, 8.7, 8.4,
        9.2, 8.3, 7.6, 8.2, 7.4, 8.8, 9.6, 8.9, 10.2, 9.5,
        10.8, 10.2, 9.1, 8.6, 9.7, 8.9, 8.4, 9.4, 8.2, 7.3,
      ],
      interval: 'Day',
      previous: 'previous day',
    },
  };
  const number = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 });
  const pesos = new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 2,
  });
  const options = { period: 'week', unit: 'kwh', view: 'line' };
  let lastId = 0;

  function rate() {
    return window.Kuryentipid.getState().rate;
  }
  function valueInUnit(kwh) {
    return options.unit === 'peso' ? kwh * rate() : kwh;
  }
  function formatReading(kwh) {
    return options.unit === 'peso' ? pesos.format(valueInUnit(kwh)) : number.format(kwh) + ' kWh';
  }
  function positions(values) {
    const peak = Math.max(...values.map(valueInUnit));
    const magnitude = 10 ** Math.floor(Math.log10(peak));
    const step = Math.ceil(peak / (4 * magnitude / 2)) * magnitude / 2;
    const max = step * 4;
    return {
      max,
      points: values.map((value, index) => ({
        x: 2 + 96 * index / (values.length - 1),
        y: 100 * (1 - valueInUnit(value) / max),
      })),
    };
  }
  function toggle(key, label, items) {
    return `<div class="tc-toggle" role="group" aria-label="${label}">${items.map(([value, text]) =>
      `<button type="button" data-tc-key="${key}" data-tc-value="${value}" aria-pressed="${options[key] === value}">${text}</button>`
    ).join('')}</div>`;
  }
  function graphic(points, id, animate) {
    const series = points.map(p => (p.x * 10).toFixed(2) + ',' + (p.y * 2).toFixed(2));
    const last = points[points.length - 1];
    const line = `<path d="M${series.join(' L')} L${last.x * 10},200 L${points[0].x * 10},200 Z" fill="url(#tc-shade-${id})"/>
      <polyline points="${series.join(' ')}" vector-effect="non-scaling-stroke" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    const width = Math.min(36, 460 / points.length);
    const bars = () => points.map((p,i) => `<rect x="${p.x * 10 - width / 2}" y="${p.y * 2}" width="${width}" height="${200 - p.y * 2}" rx="3" fill="currentColor" opacity="${i === points.length - 1 ? 1 : 0.48}"/>`).join('');
    const trace = options.view === 'line' && animate;
    const defs = `<defs><linearGradient id="tc-shade-${id}" x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="currentColor" stop-opacity=".24"/><stop offset="1" stop-color="currentColor" stop-opacity=".025"/></linearGradient></defs>`;
    return `<svg aria-hidden="true" class="${trace ? 'tc-reveal' : ''}" viewBox="0 0 1000 200" preserveAspectRatio="none">${defs}${options.view === 'line' ? line : bars()}</svg>` +
      (options.view === 'line' ? `<i class="tc-endpoint" style="left:${last.x}%;top:${last.y}%" aria-hidden="true"></i>` : '');
  }
  function reading(index) {
    const { values, labels } = profiles[options.period];
    const delta = index ? values[index] - values[index-1] : 0;
    const change = index ? (delta < 0 ? '↓ ' : delta > 0 ? '↑ ' : '') +
      number.format(Math.abs(delta) / values[index-1] * 100) + '% vs ' + profiles[options.period].previous : 'First reading';
    return { label: labels[index], value: formatReading(values[index]), change };
  }
  function render(settings = {}) {
    if (Object.hasOwn(profiles, settings.period)) options.period = settings.period;
    if (settings.unit === 'kwh' || settings.unit === 'peso') options.unit = settings.unit;
    const {labels, values, interval} = profiles[options.period];
    const { max, points } = positions(values);
    const last = values.length - 1;
    const latest = reading(last);
    const id = ++lastId;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lineMotion = options.view === 'line' && !reduced;
    const axes = [1, .75, .5, .25, 0].map(fraction =>
      '<span>' + number.format(max * fraction) + '</span>').join('');
    const stride = options.period === 'month' ? 7 : options.period === 'day' ? 2 : 1;
    const ticks = labels.map((label, index) => {
      if (index !== last && index % stride !== 0) return '';
      if (index !== last && last - index < stride / 2) return '';
      const short = options.period === 'month' ? String(index+1) : label;
      return `<span style="left:${points[index].x}%">${short}</span>`;
    }).join('');
    // Endpoint position changes use the exact same timings and coordinates as the line.
    const markerFrames = lineMotion ? `<style>@keyframes tc-point-${id}{${points.map((p,i) =>
      `${(i/last*100).toFixed(4)}%{left:${p.x}%;top:${p.y}%}`).join('')}}</style>` : '';
    return `<section class="tc-panel" data-tc-root aria-label="Sample usage trend" style="--tc-marker:tc-point-${id}">
      ${markerFrames}<header class="tc-header"><div><h2>Usage trend</h2><p>Sample readings</p></div>
      ${toggle('unit','Chart unit',[['kwh','kWh'],['peso','Peso']])}</header>
      <div class="tc-controls">${toggle('period','Chart period',[['day','Day'],['week','Week'],['month','Month']])}
      ${toggle('view','Chart type',[['line','Line'],['bar','Bars']])}</div>
      <div class="tc-reading"><div><span data-tc-label>${latest.label}</span><strong data-tc-reading>${latest.value}</strong></div>
      <span data-tc-change>${latest.change}</span></div>
      <div class="tc-chart"><div class="tc-scale" aria-hidden="true">${axes}</div>
      <div class="tc-canvas" role="slider" tabindex="0" aria-label="Explore sample readings"
        aria-valuemin="1" aria-valuemax="${values.length}" aria-valuenow="${values.length}" aria-valuetext="${latest.label}, ${latest.value}">
        ${graphic(points,id,lineMotion)}
        <i data-tc-cursor hidden></i>
      </div><div class="tc-ticks" aria-hidden="true">${ticks}</div></div>
      <div class="tc-footer"><details><summary>Data table</summary><table><thead><tr><th scope="col">${interval}</th><th scope="col">${options.unit === 'peso' ? 'Cost at ₱' + number.format(rate()) + '/kWh' : 'Energy use'}</th></tr></thead><tbody>
      ${labels.map((label,index) => `<tr><th scope="row">${label}</th><td>${formatReading(values[index])}</td></tr>`).join('')}</tbody></table></details>
      ${lineMotion ? '<button class="tc-replay" type="button" data-tc-replay aria-label="Replay chart animation">↻ Replay</button>' : ''}</div>
      </section>`;
  }

  function selectPoint(canvas,index) {
    const root = canvas.closest('[data-tc-root]');
    const { values } = profiles[options.period];
    const selected = Math.max(0, Math.min(values.length - 1, index));
    const point = positions(values).points[selected];
    const selectedReading = reading(selected);
    root.querySelector('[data-tc-label]').textContent = selectedReading.label;
    root.querySelector('[data-tc-reading]').textContent = selectedReading.value;
    root.querySelector('[data-tc-change]').textContent = selectedReading.change;
    canvas.setAttribute('aria-valuenow', String(selected + 1));
    canvas.setAttribute('aria-valuetext', selectedReading.label + ', ' + selectedReading.value);
    const cursor = canvas.querySelector('[data-tc-cursor]');
    cursor.hidden = false;
    cursor.style.left = point.x + '%';
    cursor.style.setProperty('--tc-y', point.y + '%');
  }
  function pointAtPointer(event) {
    const canvas = event.target.closest?.('.tc-canvas');
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    selectPoint(canvas, Math.round((x-.02) / .96 * (profiles[options.period].values.length - 1)));
  }
  document.addEventListener('pointerdown', pointAtPointer);
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' || event.buttons) pointAtPointer(event);
  });
  document.addEventListener('keydown', event => {
    const canvas = event.target.closest?.('.tc-canvas');
    if (!canvas) return;
    const position = Number(canvas.getAttribute('aria-valuenow')) - 1;
    const keys = { ArrowLeft:position-1, ArrowDown:position-1, ArrowRight:position+1, ArrowUp:position+1, Home:0, End:profiles[options.period].values.length-1 };
    if (Object.hasOwn(keys, event.key)) {
      event.preventDefault();
      selectPoint(canvas, keys[event.key]);
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-tc-key],[data-tc-replay]');
    if (!button) return;
    const root = button.closest('[data-tc-root]');
    if (!root) return;
    const { tcKey:key, tcValue:value } = button.dataset;
    if (key) options[key] = value;
    root.outerHTML = render();
    if (key) document.dispatchEvent(new CustomEvent('trendchange', { bubbles:true, detail:{ ...options } }));
    const focusSelector = key ? `[data-tc-key="${key}"][data-tc-value="${value}"]` : '[data-tc-replay]';
    document.querySelector(focusSelector)?.focus({ preventScroll:true });
  });

  return Object.freeze({ render, getUnit:() => options.unit, getPeriod:() => options.period });
})();
