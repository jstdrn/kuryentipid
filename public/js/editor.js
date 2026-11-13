(() => {
  'use strict';

  const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 2
  });
  const amount = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 1 });
  const read = () => window.Kuryentipid.getState();
  const findAppliance = id => read().appliances.find(item => item.id === id);
  const historyLimit = 20;
  let dialog;
  let returnFocus;

  function escape(value) {
    const span = document.createElement('span');
    span.textContent = String(value ?? '');
    return span.innerHTML.replace(/"/g, '&quot;');
  }

  function historyOf(item) {
    if (!Array.isArray(item.history)) return [];
    return item.history.filter(entry => entry && typeof entry.label === 'string' &&
      Number.isFinite(entry.time) && !Number.isNaN(new Date(entry.time).getTime())).slice(0, historyLimit);
  }

  function record(item, label, detail) {
    item.history = [{ time: Date.now(), label, detail }, ...historyOf(item)].slice(0, historyLimit);
  }

  function changedDetails(previous, draft) {
    const changes = [];
    if (previous.name !== draft.name) changes.push('Renamed to ' + draft.name);
    if (previous.catalogId !== draft.catalogId && productFor(draft)) changes.push('Model linked: ' + modelTitle(productFor(draft)));
    if (previous.watts !== draft.watts && draft.watts != null) changes.push(amount.format(draft.watts) + ' W');
    if (previous.quantity !== draft.quantity) changes.push('Quantity ' + draft.quantity);
    if (previous.hours !== draft.hours) changes.push(amount.format(draft.hours) + ' h/day');
    if (previous.days !== draft.days) changes.push(draft.days + ' days/week');
    if (previous.displayIcon !== draft.displayIcon || previous.customIcon !== draft.customIcon) changes.push('Icon updated');
    return changes.join(' · ');
  }

  function modal(title, contents, actions = '', back = null) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'kt-dialog';
      dialog.setAttribute('aria-labelledby', 'kt-dialog-title');
      document.body.append(dialog);
      dialog.addEventListener('click', event => {
        if (event.target === dialog) {
          const bounds = dialog.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right ||
              event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
        }
      });
      dialog.addEventListener('close', () => {
        if (dialog.open) return;
        document.documentElement.classList.remove('kt-modal-open');
        if (returnFocus?.isConnected) {
          returnFocus.focus({ preventScroll: true });
          return;
        }
        const action = returnFocus?.attributes
          ? [...returnFocus.attributes].find(attribute => attribute.name.startsWith('data-')) : null;
        if (action) {
          const selector = '[' + action.name + '="' + CSS.escape(action.value) + '"]';
          const replacement = [...document.querySelectorAll(selector)].find(element => element.getClientRects().length);
          replacement?.focus({ preventScroll: true });
        }
      });
    }
    const opening = !dialog.open;
    if (opening) returnFocus = document.activeElement;
    dialog.innerHTML = `
      <header class="kt-head">
        ${back ? `<button type="button" class="kt-icon-button" data-back aria-label="Back">${window.icon('back', 20)}</button>` : ''}
        <h2 id="kt-dialog-title" tabindex="-1">${escape(title)}</h2>
        <button type="button" class="kt-icon-button" data-close aria-label="Close">${window.icon('close', 20)}</button>
      </header>
      <div class="kt-body">${contents}</div>
      ${actions ? `<footer class="kt-footer">${actions}</footer>` : ''}`;
    dialog.querySelector('[data-close]').onclick = () => dialog.close();
    if (back) dialog.querySelector('[data-back]').onclick = back;
    if (opening) {
      document.documentElement.classList.add('kt-modal-open');
      dialog.showModal();
    }
    dialog.querySelector('h2').focus({ preventScroll: true });
    return dialog;
  }

  const primary = (label, form) =>
    `<button class="kt-primary" type="submit" form="${form}">${label}</button>`;
  const field = (name, label, value, attributes = '') =>
    `<label class="kt-field"><span>${label}</span><input id="kt-${name}" name="${name}" value="${escape(value)}" ${attributes} required></label>`;
  const defaultCustom = () => ({
    icon: 'OT', name: '', detail: '', watts: '', hours: 1, days: 7, quantity: 1
  });

  function openEditor(id) {
    if (id) {
      const item = findAppliance(id);
      if (item) detailsStep({ ...item }, true);
      return;
    }
    choosePreset();
  }


  const productFor = item => window.ApplianceCatalog?.find(model => model.id === item.catalogId);
  const labelBased = product => product && product.watts == null &&
    (product.monthlyKwh != null || product.annualKwh != null);
  const deviceSymbol = (item, size) => window.applianceIcon(item, size);
  const modelTitle = product => [product.brand, product.model].filter(Boolean).join(' ');
  function rating(product) {
    if (labelBased(product)) {
      return product.monthlyKwh != null
        ? amount.format(product.monthlyKwh) + ' kWh/month'
        : amount.format(product.annualKwh) + ' kWh/year';
    }
    return product.watts.toLocaleString('en-PH') + ' W';
  }

  function sourceCard(product, watts) {
    if (!product) return '';
    const overridden = !labelBased(product) && watts != null && Number(watts) !== product.watts;
    const source = new URL(product.source);
    if (source.protocol !== 'https:') return '';
    return `<aside class="kt-source">
      <div><strong>${escape(modelTitle(product))}</strong>
      <a href="${escape(source.href)}" target="_blank" rel="noopener noreferrer">${escape(product.sourceLabel || 'Specifications')} ↗</a></div>
      <p>${escape(product.ratingType)} · ${escape(rating(product))}</p>
      <small ${overridden ? '' : 'hidden'} data-override>Your estimate uses your entered wattage.</small>
    </aside>`;
  }

  function choosePreset(filter = {}, existing = null) {
    const catalog = window.ApplianceCatalog || [];
    const categories = [...new Set(catalog.map(item => item.category))].sort();
    let selected = categories.includes(filter.category) ? filter.category : '';
    const view = modal(existing ? 'Choose exact model' : 'Add appliance', `
      <label class="kt-field kt-search"><span>Find a model</span>
        <span class="kt-search-input">${window.icon('search', 19)}
        <input type="search" id="kt-search" value="${escape(filter.query || '')}" placeholder="Search brand, model, or appliance" autocomplete="off"></span>
      </label>
      <div class="kt-filter-row" role="group" aria-label="Filter by appliance category">
        ${['', ...categories].map(category => `<button type="button" data-category="${escape(category)}" aria-pressed="${category === selected}">${escape(category || 'All')}</button>`).join('')}
      </div>
      <p class="kt-match-count" id="kt-match-count" role="status"></p>
      <div id="kt-preset-list"></div>`,
      existing ? '' : '<button type="button" class="kt-secondary" data-custom>Enter manually</button>',
      existing ? () => detailsStep(existing, true) : null);
    const list = view.querySelector('#kt-preset-list');
    const search = view.querySelector('#kt-search');
    const categoryButtons = [...view.querySelectorAll('[data-category]')];
    function showMatches() {
      const keywords = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const matches = catalog.filter(product => {
        const terms = [product.category, product.brand, product.name, product.model, product.icon].join(' ').toLowerCase();
        return (!selected || product.category === selected) && keywords.every(word => terms.includes(word));
      });
      view.querySelector('#kt-match-count').textContent = matches.length + (matches.length === 1 ? ' model' : ' models');
      list.innerHTML = categories.map(category => {
        const models = matches.filter(product => product.category === category);
        if (!models.length) return '';
        return `<section class="kt-model-group"><h3>${escape(category)}</h3>
          ${models.map(product => `<button type="button" class="kt-preset" data-product="${escape(product.id)}">
            <span class="kt-preset-code">${deviceSymbol(product, 23)}</span>
            <span class="kt-model-copy"><strong>${escape(modelTitle(product))}</strong>
            <small>${escape(product.name)}</small></span><span class="kt-model-rating">${escape(rating(product))}</span>
            <span class="kt-chevron" aria-hidden="true">${window.icon('chevronRight', 16)}</span></button>`).join('')}</section>`;
      }).join('');
      if (!matches.length) list.innerHTML = '<p class="kt-note">No matching models. Try another brand or category.</p>';
    }
    const restore = () => choosePreset({ query: search.value, category: selected }, existing);
    search.oninput = showMatches;
    categoryButtons.forEach(button => {
      button.onclick = () => {
        selected = button.dataset.category;
        categoryButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
        showMatches();
      };
    });
    list.onclick = event => {
      const button = event.target.closest('[data-product]');
      if (!button) return;
      const product = catalog.find(entry => entry.id === button.dataset.product);
      if (!product) return;
      detailsStep({
        ...(existing || defaultCustom()), catalogId: product.id, name: existing?.name || product.name.slice(0, 60),
        detail: modelTitle(product), icon: product.icon, watts: product.watts,
        hours: labelBased(product) ? 24 : (existing?.hours ?? '')
      }, Boolean(existing), restore);
    };
    if (!existing) view.querySelector('[data-custom]').onclick = () => detailsStep(defaultCustom(), false, restore);
    showMatches();
  }

  function iconFields(draft) {
    const choices = window.applianceIconChoices;
    const current = draft.displayIcon || draft.icon || 'OT';
    return `<details class="kt-icon-picker"><summary><span class="kt-icon-preview" data-preview>${deviceSymbol(draft, 23)}</span>
      <span>Appliance icon</span><span class="kt-chevron">${window.icon('down', 16)}</span></summary>
      <div class="kt-icon-options" role="group" aria-label="Choose an appliance icon">
        ${choices.map(choice => `<button type="button" title="${escape(choice.label)}" aria-label="${escape(choice.label)}"
          aria-pressed="${!draft.customIcon && current === choice.code}" data-glyph="${escape(choice.code)}">${window.icon(choice.code, 21)}</button>`).join('')}
      </div>
      <div class="kt-photo-actions"><button class="kt-secondary" type="button" data-upload>Upload image</button>
        <button class="kt-subtle" type="button" data-clear-photo ${draft.customIcon ? '' : 'hidden'}>Remove image</button>
        <input type="file" data-photo hidden accept="image/png,image/jpeg,image/webp">
      </div>
      <p class="kt-note kt-photo-status" data-photo-status role="status">PNG, JPEG, or WebP · up to 3 MB</p>
    </details>`;
  }

  function bindIconPicker(form, draft) {
    const fileInput = form.querySelector('[data-photo]');
    const preview = form.querySelector('[data-preview]');
    const clear = form.querySelector('[data-clear-photo]');
    const status = form.querySelector('[data-photo-status]');
    const buttons = [...form.querySelectorAll('[data-glyph]')];
    const submit = dialog.querySelector('.kt-primary');
    let changeId = 0;
    function refresh() {
      preview.innerHTML = deviceSymbol(draft, 23);
      clear.hidden = !draft.customIcon;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(!draft.customIcon && (draft.displayIcon || draft.icon) === button.dataset.glyph)));
    }
    buttons.forEach(button => {
      button.onclick = () => {
        changeId++;
        submit.disabled = false;
        draft.customIcon = '';
        draft.displayIcon = button.dataset.glyph;
        refresh();
        status.textContent = button.title + ' icon selected.';
      };
    });
    form.querySelector('[data-upload]').onclick = () => fileInput.click();
    clear.onclick = () => {
      changeId++;
      submit.disabled = false;
      draft.customIcon = '';
      refresh();
      status.textContent = 'Image removed.';
    };
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const request = ++changeId;
      submit.disabled = true;
      status.textContent = 'Preparing image…';
      try {
        const icon = await LocalPhoto.resize(file);
        if (request !== changeId || !form.isConnected || !dialog.open) return;
        draft.customIcon = icon;
        refresh();
        status.textContent = 'Image ready.';
      } catch (error) {
        if (request === changeId) status.textContent = error.message || 'Choose another image.';
      } finally {
        if (request === changeId) submit.disabled = false;
        fileInput.value = '';
      }
    };
  }

  function detailsStep(draft, editing, back = editing ? null : choosePreset) {
    const product = productFor(draft);
    const label = labelBased(product);
    const view = modal(editing ? 'Edit appliance' : 'Appliance details', `
      <form id="kt-details" class="kt-form">
        ${product ? sourceCard(product, draft.watts) : (editing ? '<button type="button" class="kt-match-model" data-match-model>Choose exact model ' + window.icon('chevronRight', 16) + '</button>' : '')}
        ${field('name', 'Appliance name', draft.name, 'maxlength="60" placeholder="e.g. Bedroom aircon"')}
        <div class="${label ? '' : 'kt-fields'}">
          ${label ? '' : field('watts', 'Wattage (W)', draft.watts, 'type="number" inputmode="decimal" min="0.01" max="20000" step="any"')}
          ${field('quantity', 'Quantity', draft.quantity, 'type="number" inputmode="numeric" min="1" max="50" step="1"')}
        </div>
        ${label ? '<p class="kt-note">The energy label provides a standard consumption estimate. Actual use varies by household.</p>' : ''}
        ${iconFields(draft)}
      </form>`,
      `${editing ? '<button type="button" class="kt-text kt-remove" data-remove>Remove appliance</button>' : ''}${primary(label ? (editing ? 'Save changes' : 'Save appliance') : 'Set schedule', 'kt-details')}`,
      back);
    if (editing) view.querySelector('[data-remove]').onclick = () => confirmRemoval(draft);
    const form = view.querySelector('form');
    bindIconPicker(form, draft);
    if (editing && !product) {
      form.querySelector('[data-match-model]').onclick = () => {
        const category = window.ApplianceCatalog.find(model => model.icon === draft.icon)?.category;
        const name = form.elements.name.value.trim() || draft.name;
        const quantity = form.elements.quantity.validity.valid ? form.elements.quantity.valueAsNumber : draft.quantity;
        choosePreset({ category }, { ...draft, name, quantity });
      };
    }
    if (product && !label) form.elements.watts.oninput = () => {
      const override = form.querySelector('[data-override]');
      if (override) override.hidden = !form.elements.watts.validity.valid || form.elements.watts.valueAsNumber === product.watts;
    };
    form.onsubmit = event => {
      event.preventDefault();
      if (view.querySelector('.kt-primary').disabled) return;
      const name = form.elements.name.value.trim();
      if (!name) {
        form.elements.name.setCustomValidity('Enter an appliance name.');
        form.elements.name.reportValidity();
        return;
      }
      const next = { ...draft, name, watts: label ? null : form.elements.watts.valueAsNumber,
        quantity: form.elements.quantity.valueAsNumber };
      if (label) saveAppliance({ ...next, hours: 24, days: 7 }, editing);
      else scheduleStep(next, editing, back);
    };
    form.elements.name.oninput = () => form.elements.name.setCustomValidity('');
  }

  function scheduleStep(draft, editing, back) {
    const view = modal('Usage schedule', `
      <p class="kt-summary-name">${escape(draft.name)} <span>· ${amount.format(draft.watts)} W</span></p>
      <form id="kt-schedule" class="kt-form">
        <div class="kt-fields">
          ${field('hours', 'Hours per day', draft.hours, 'type="number" inputmode="decimal" min="0" max="24" step="any"')}
          ${field('days', 'Days per week', draft.days, 'type="number" inputmode="numeric" min="1" max="7" step="1"')}
        </div>
        <label class="kt-range"><span class="kt-sr">Adjust daily hours</span>
          <input type="range" min="0" max="24" step="0.1" value="${escape(draft.hours)}" id="kt-hours-range">
        </label>
        <div class="kt-range-ends"><span>0 h</span><span>24 h</span></div>
        <div class="kt-result" aria-live="polite">
          <span>Monthly estimate</span><strong id="kt-estimate"></strong><small id="kt-energy"></small>
        </div>
      </form>`, primary(editing ? 'Save changes' : 'Save appliance', 'kt-schedule'),
      () => detailsStep(draft, editing, back));
    const form = view.querySelector('form');
    const range = view.querySelector('#kt-hours-range');
    const update = () => {
      const hours = form.elements.hours.valueAsNumber;
      const days = form.elements.days.valueAsNumber;
      const valid = form.elements.hours.validity.valid && form.elements.days.validity.valid;
      if (valid) Object.assign(draft, { hours, days });
      const usage = window.Energy.kwh(draft);
      view.querySelector('#kt-estimate').textContent = valid ? peso.format(usage * read().rate) : '—';
      view.querySelector('#kt-energy').textContent = valid
        ? `${amount.format(usage)} kWh · 30 days at ${peso.format(read().rate)}/kWh` : '';
    };
    form.elements.hours.oninput = () => { range.value = form.elements.hours.value; update(); };
    range.oninput = () => { form.elements.hours.value = range.value; update(); };
    form.elements.days.oninput = update;
    update();
    form.onsubmit = event => {
      event.preventDefault();
      saveAppliance(draft, editing);
    };
  }

  function saveAppliance(draft, editing) {
    const state = read();
    if (editing) {
      const previous = findAppliance(draft.id);
      if (!previous) { dialog.close(); return; }
      const changes = changedDetails(previous, draft);
      Object.assign(previous, draft);
      if (changes) record(previous, 'Appliance updated', changes);
      if (state.goal?.applianceId === draft.id && (labelBased(productFor(draft)) ||
          (state.goal.baselineHours === undefined && state.goal.targetHours >= draft.hours))) {
        state.goal = null;
        state.checkedDays = [];
      }
    } else {
      draft.id = window.Energy.newId();
      if (!draft.detail) draft.detail = 'Custom appliance';
      const product = productFor(draft);
      record(draft, 'Appliance added', labelBased(product) ? rating(product) :
        amount.format(draft.hours) + ' h/day · ' + draft.days + ' days/week');
      state.appliances.push(draft);
    }
    dialog.close();
    window.Kuryentipid.commit(editing ? 'Appliance updated' : 'Appliance added');
  }

  function confirmRemoval(item) {
    const view = modal('Remove appliance?', `<p class="kt-description">${escape(item.name)} will be removed from your household estimate.</p>`,
      '<button type="button" class="kt-secondary" data-keep>Keep appliance</button><button type="button" class="kt-danger" data-delete>Remove</button>');
    view.querySelector('[data-keep]').onclick = () => detailsStep(item, true);
    view.querySelector('[data-delete]').onclick = () => {
      const state = read();
      state.appliances = state.appliances.filter(current => current.id !== item.id);
      if (state.goal?.applianceId === item.id) {
        state.goal = null;
        state.checkedDays = [];
      }
      dialog.close();
      window.Kuryentipid.commit('Appliance removed');
    };
  }

  function slider(id, label, hours) {
    return '<div class="kt-slider"><label class="kt-slider-label" for="' + id + '">' +
      label + '<output for="' + id + '" id="' + id + '-output">' + amount.format(hours) + ' h</output></label>' +
      '<input id="' + id + '" type="range" min="0" max="24" step="0.1" value="' + hours + '">' +
      '<div class="kt-range-ends"><span>0 h</span><span>24 h</span></div></div>';
  }

  function openDetail(id) {
    const item = findAppliance(id);
    if (!item) return;
    const product = productFor(item);
    const label = labelBased(product);
    const view = modal(item.name, sourceCard(product, item.watts) +
      (label ? '' : slider('kt-detail-hours', 'Daily usage', item.hours)) +
      '<dl class="kt-specs kt-specs-first">' +
        (!product && item.detail && item.detail !== 'Custom appliance' ? '<div><dt>Model</dt><dd>' + escape(item.detail) + '</dd></div>' : '') +
        (label ? '' : '<div><dt>Wattage used</dt><dd>' + amount.format(item.watts) + ' W</dd></div>' +
        '<div><dt>Days per week</dt><dd>' + item.days + '</dd></div>') +
        '<div><dt>Quantity</dt><dd class="kt-counter"><button type="button" data-minus aria-label="Decrease quantity">−</button>' +
        '<output id="kt-count"></output><button type="button" data-plus aria-label="Increase quantity">+</button></dd></div></dl>' +
      '<div class="kt-detail-totals"><div class="kt-result"><span>' + (label ? 'Household share' : 'Cost per hour') + '</span><strong id="kt-hour-cost"></strong>' +
      '<small id="kt-hour-kwh"></small></div><div class="kt-result"><span>Monthly estimate</span><strong id="kt-cost"></strong>' +
      '<small id="kt-detail-kwh"></small></div></div>' +
      '<div class="kt-shortcuts">' + [['Tips','leaf'], ['History','calendar'], ['Devices','appliances']].map(([label,symbol]) =>
        '<button type="button" data-sheet="' + label + '">' + window.icon(symbol, 18) + '<span>' + label + '</span></button>'
      ).join('') + '</div>',
      '<button type="button" class="kt-secondary" data-edit>Edit details</button>' +
      (label ? '' : '<button type="button" class="kt-primary" data-calc>Savings calculator</button>'));
    const input = view.querySelector('#kt-detail-hours');
    const update = () => {
      const hours = input ? input.valueAsNumber : item.hours;
      const usage = window.Energy.kwh({ ...item, hours });
      view.querySelector('#kt-count').textContent = item.quantity;
      view.querySelector('[data-minus]').disabled = item.quantity <= 1;
      view.querySelector('[data-plus]').disabled = item.quantity >= 50;
      if (input) view.querySelector('#kt-detail-hours-output').textContent = amount.format(hours) + ' h';
      const hourly = item.watts * item.quantity / 1000;
      if (label) {
        const total = window.Energy.summary(read()).kwh;
        view.querySelector('#kt-hour-cost').textContent = amount.format(total ? usage / total * 100 : 0) + '%';
        view.querySelector('#kt-hour-kwh').textContent = 'of monthly usage';
      } else {
        view.querySelector('#kt-hour-cost').textContent = peso.format(hourly * read().rate);
        view.querySelector('#kt-hour-kwh').textContent = hourly.toLocaleString('en-PH', { maximumFractionDigits: 3 }) + ' kWh';
      }
      view.querySelector('#kt-cost').textContent = peso.format(usage * read().rate);
      view.querySelector('#kt-detail-kwh').textContent = amount.format(usage) + ' kWh / 30 days';
    };
    function setQuantity(delta) {
      const previous = item.quantity;
      item.quantity = Math.max(1, Math.min(50, item.quantity + delta));
      if (previous === item.quantity) return;
      record(item, 'Quantity changed', previous + ' → ' + item.quantity);
      window.Kuryentipid.commit('Quantity updated');
      update();
    }
    view.querySelector('[data-plus]').onclick = () => setQuantity(1);
    view.querySelector('[data-minus]').onclick = () => setQuantity(-1);
    if (input) input.oninput = update;
    if (input) input.onchange = () => {
      const previous = item.hours;
      item.hours = input.valueAsNumber;
      if (previous === item.hours) return;
      record(item, 'Daily usage changed', amount.format(previous) + ' → ' + amount.format(item.hours) + ' h/day');
      window.Kuryentipid.commit('Schedule updated');
    };
    view.querySelectorAll('[data-sheet]').forEach(button => {
      button.onclick = () => detailSheet(item, button.dataset.sheet);
    });
    view.querySelector('[data-edit]').onclick = () => detailsStep({ ...item }, true);
    if (!label) view.querySelector('[data-calc]').onclick = () => openCalculator(id, () => openDetail(id));
    update();
  }

  function detailSheet(item, section) {
    const back = () => openDetail(item.id);
    if (section === 'Tips') {
      showAdvice({ ...item, categoryCode: item.icon }, back);
      return;
    }
    if (section === 'History') {
      openHistory(item);
      return;
    }
    const choices = read().appliances.map(device =>
      '<button type="button" class="kt-preset" data-switch="' + escape(device.id) + '">' +
      '<span class="kt-preset-code">' + deviceSymbol(device, 21) + '</span>' +
      '<span><strong>' + escape(device.name) + '</strong><small>' + (labelBased(productFor(device)) ? rating(productFor(device)) : amount.format(device.watts) + ' W') + '</small></span>' +
      '<span class="kt-chevron">' + window.icon(device.id === item.id ? 'check' : 'chevronRight', 18) + '</span></button>'
    ).join('');
    const view = modal('Devices', choices, '', back);
    view.querySelectorAll('[data-switch]').forEach(button => {
      button.onclick = () => openDetail(button.dataset.switch);
    });
  }

  const measured = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 3 });
  const monthName = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'long', timeZone: 'UTC' });
  const monthPattern = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;

  function readingsOf(item) {
    const rows = Array.isArray(item.monthlyReadings) ? item.monthlyReadings : [];
    return new Map(rows.filter(row => row && monthPattern.test(row.month) &&
      Number.isFinite(row.kwh) && row.kwh >= 0).map(row => [row.month, row.kwh]));
  }

  function previousMonth(month) {
    const date = new Date(month + '-01T00:00:00Z');
    date.setUTCMonth(date.getUTCMonth() - 1);
    return date.toISOString().slice(0, 7);
  }

  function monthLabel(month) {
    return monthName.format(new Date(month + '-01T00:00:00Z'));
  }

  function openHistory(item) {
    const readings = readingsOf(item);
    const months = [...readings.keys()].sort().reverse();
    const rows = months.map(month => {
      const kwh = readings.get(month);
      const previous = previousMonth(month);
      const difference = readings.has(previous) ? Math.round((kwh - readings.get(previous)) * 1000) / 1000 : null;
      const comparison = difference === null ? '' : `<small>${difference === 0 ? 'No change' :
        measured.format(Math.abs(difference)) + ' kWh ' + (difference > 0 ? 'more' : 'less')} than ${monthLabel(previous)}</small>`;
      return `<li><div><time datetime="${month}">${monthLabel(month)}</time><strong>${measured.format(kwh)} kWh</strong></div>
        <button type="button" class="kt-reading-edit" data-edit-month="${month}" aria-label="Edit ${monthLabel(month)}">${window.icon('edit', 17)}</button>
        ${comparison}</li>`;
    }).join('');
    const format = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
    const events = historyOf(item).map(entry => `<li><strong>${escape(entry.label)}</strong><p>${escape(entry.detail || '')}</p>
      <time datetime="${new Date(entry.time).toISOString()}">${format.format(entry.time)}</time></li>`).join('');
    const view = modal('History', `
      <div class="kt-guide-device"><span class="kt-preset-code">${deviceSymbol(item, 23)}</span><strong>${escape(item.name)}</strong></div>
      <section class="kt-readings"><header><h3>Measured usage</h3><button type="button" class="kt-add-month" data-add-month>${window.icon('plus', 16)} Add month</button></header>
        ${rows ? '<ul class="kt-reading-list">' + rows + '</ul>' : '<p class="kt-note">No monthly readings yet. Record the kWh used by this appliance.</p>'}
      </section>
      <details class="kt-activity"><summary>Appliance activity ${window.icon('down', 16)}</summary>
        ${events ? '<ol class="kt-history">' + events + '</ol>' : '<p class="kt-note">No appliance changes recorded yet.</p>'}
      </details>`, '', () => openDetail(item.id));
    view.querySelector('[data-add-month]').onclick = () => editReading(item);
    view.querySelectorAll('[data-edit-month]').forEach(button => {
      button.onclick = () => editReading(item, button.dataset.editMonth);
    });
  }

  function editReading(item, original = null) {
    const readings = readingsOf(item);
    const today = new Date();
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    const view = modal(original ? 'Edit monthly reading' : 'Add monthly reading', `
      <form class="kt-form" id="kt-reading-form">
        <p class="kt-summary-name">${escape(item.name)}</p>
        ${field('month', 'Billing month', original || currentMonth, 'type="month" min="1000-01" max="' + currentMonth + '"')}
        ${field('kwh', 'Measured usage (kWh)', original ? readings.get(original) : '', 'type="number" inputmode="decimal" min="0" step="0.001" aria-describedby="kt-reading-help"')}
        <p id="kt-reading-help" class="kt-note">Use this appliance’s total for the month from a plug meter, submeter, or appliance app.</p>
        <p class="kt-note kt-duplicate" data-duplicate role="status" hidden></p>
      </form>`, (original ? '<button type="button" class="kt-text" data-remove-month>Remove</button>' : '') +
        primary('Save reading', 'kt-reading-form'), () => openHistory(item));
    const form = view.querySelector('form');
    const monthInput = form.elements.month;
    function showDuplicate() {
      const month = monthInput.value;
      const exists = month !== original && readings.has(month);
      const note = form.querySelector('[data-duplicate]');
      note.hidden = !exists;
      note.textContent = exists ? 'Saving will replace the existing ' + measured.format(readings.get(month)) + ' kWh reading for ' + monthLabel(month) + '.' : '';
    }
    monthInput.oninput = showDuplicate;
    showDuplicate();
    form.onsubmit = event => {
      event.preventDefault();
      const month = monthInput.value;
      const kwh = form.elements.kwh.valueAsNumber;
      if (!monthPattern.test(month) || month > currentMonth || !Number.isFinite(kwh) || kwh < 0) return;
      if (original && original !== month) readings.delete(original);
      readings.set(month, kwh);
      storeReadings(item, readings, 'Monthly reading saved');
    };
    if (original) view.querySelector('[data-remove-month]').onclick = () => {
      const confirm = modal('Remove reading?', `<p class="kt-description">Remove the ${measured.format(readings.get(original))} kWh reading for ${monthLabel(original)}?</p>`,
        '<button type="button" class="kt-secondary" data-keep-month>Keep reading</button><button type="button" class="kt-danger" data-confirm-month>Remove reading</button>');
      confirm.querySelector('[data-keep-month]').onclick = () => editReading(item, original);
      confirm.querySelector('[data-confirm-month]').onclick = () => {
        readings.delete(original);
        storeReadings(item, readings, 'Monthly reading removed');
      };
    };
  }

  function storeReadings(item, readings, message) {
    item.monthlyReadings = Array.from(readings, ([month, kwh]) => ({ month, kwh }));
    window.Kuryentipid.commit(message);
    openHistory(item);
  }

  function showAdvice(item, back) {
    const { sources, steps } = window.ApplianceTips;
    const advice = steps[item.categoryCode] || steps.OT;
    const articles = advice.map(([title, description, ref]) => {
      const [name, url] = sources[ref];
      return `<li><h3>${escape(title)}</h3><p>${escape(description)}</p>
        <a class="kt-citation" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(name)} <span aria-hidden="true">↗</span></a></li>`;
    }).join('');
    modal('Tips & tricks', `<div class="kt-guide-device"><span class="kt-preset-code">${deviceSymbol(item, 22)}</span>
      <strong>${escape(item.name)}</strong></div><ul class="kt-guidance">${articles}</ul>`, '', back);
  }

  function openTips(id) {
    const item = findAppliance(id);
    if (item) { showAdvice({ ...item, categoryCode: item.icon }, () => openDetail(item.id)); return; }
    const choices = window.applianceIconChoices;
    const devices = read().appliances;
    const categories = choices.filter(choice => !devices.some(device => device.icon === choice.code));
    function row(key, label, symbol) {
      return `<button type="button" class="kt-preset" data-tip-choice="${escape(key)}">
        <span class="kt-preset-code">${symbol}</span><span class="kt-model-copy"><strong>${escape(label)}</strong></span>
        <span class="kt-chevron">${window.icon('chevronRight', 16)}</span></button>`;
    }
    const yours = devices.map(device => row('device:' + device.id, device.name, deviceSymbol(device, 22))).join('');
    const others = categories.map(choice => row('type:' + choice.code, choice.label, window.icon(choice.code, 22))).join('');
    const view = modal('Tips & tricks',
      (yours ? '<h3 class="kt-section-name">Your appliances</h3>' + yours : '') +
      (others ? '<h3 class="kt-section-name kt-guide-more">' + (yours ? 'Other appliances' : 'Appliance types') + '</h3>' + others : ''));
    view.querySelectorAll('[data-tip-choice]').forEach(button => {
      button.onclick = () => {
        const key = button.dataset.tipChoice;
        if (key.startsWith('device:')) {
          const device = findAppliance(key.slice(7));
          if (device) showAdvice({ ...device, categoryCode: device.icon }, () => openTips());
        } else {
          const choice = choices.find(entry => entry.code === key.slice(5));
          if (choice) showAdvice({ name: choice.label, icon: choice.code, categoryCode: choice.code }, () => openTips());
        }
      };
    });
  }

  function openCalculator(id, back = null) {
    const state = read();
    const eligible = state.appliances.filter(device => !labelBased(productFor(device)));
    if (!eligible.length) {
      const message = state.appliances.length ? 'Savings simulations need an appliance with a wattage and daily hours. Your current appliances use fixed energy-label estimates.' : 'Add an appliance to estimate how much a shorter schedule could save.';
      const empty = modal('Savings calculator', '<p class="kt-description">' + message + '</p>',
        '<button type="button" class="kt-primary" data-add>Add appliance</button>', back);
      empty.querySelector('[data-add]').onclick = choosePreset;
      return;
    }
    let item = eligible.find(device => device.id === id) || eligible.find(device => device.id === state.goal?.applianceId) || eligible[0];
    const options = eligible.map(entry =>
      '<option value="' + escape(entry.id) + '"' + (entry.id === item.id ? ' selected' : '') + '>' + escape(entry.name) + '</option>'
    ).join('');
    const view = modal('Savings calculator',
      '<label class="kt-field"><span>Appliance</span><select id="kt-calc-device">' + options + '</select></label>' +
      slider('kt-current', 'Current daily use', item.hours) +
      slider('kt-proposed', 'Proposed daily use', Math.max(0, item.hours - 1)) +
      '<section class="kt-result"><span>Potential monthly savings</span><strong id="kt-monthly"></strong>' +
      '<small id="kt-yearly"></small></section>',
      '<button type="button" class="kt-primary" data-save-goal>Set daily goal</button>', back);
    const current = view.querySelector('#kt-current');
    const proposed = view.querySelector('#kt-proposed');
    const saveGoal = view.querySelector('[data-save-goal]');
    function update() {
      const baselineHours = current.valueAsNumber;
      const targetHours = proposed.valueAsNumber;
      const result = window.Energy.saving({ ...item, hours: baselineHours }, read().rate, targetHours);
      view.querySelector('#kt-current-output').textContent = amount.format(baselineHours) + ' h';
      view.querySelector('#kt-proposed-output').textContent = amount.format(targetHours) + ' h';
      view.querySelector('#kt-monthly').textContent = peso.format(result.cost);
      view.querySelector('#kt-yearly').textContent = peso.format(result.cost * 12) + ' per year';
      saveGoal.disabled = targetHours >= baselineHours;
    }
    function resetValues() {
      const goal = state.goal?.applianceId === item.id ? state.goal : null;
      current.value = goal?.baselineHours ?? item.hours;
      proposed.value = goal?.targetHours ?? Math.max(0, item.hours - 1);
      update();
    }
    view.querySelector('#kt-calc-device').onchange = event => {
      item = findAppliance(event.target.value);
      resetValues();
    };
    current.oninput = update;
    proposed.oninput = update;
    saveGoal.onclick = () => {
      const active = read();
      const baselineHours = current.valueAsNumber;
      const targetHours = proposed.valueAsNumber;
      const changed = active.goal?.applianceId !== item.id ||
        active.goal?.baselineHours !== baselineHours || active.goal?.targetHours !== targetHours;
      if (changed) active.checkedDays = [];
      active.goal = { applianceId: item.id, baselineHours, targetHours };
      dialog.close();
      window.Kuryentipid.commit('Daily goal saved');
      window.Kuryentipid.navigate('savings');
    };
    resetValues();
  }

  function openSetting(key) {
    const options = {
      rate: ['Electricity rate', 'Rate per kWh (₱)', 'Use the rate from your latest electricity bill.', 0.01, 500, 0.0001],
      bill: ['Compare with your bill', 'Actual bill (₱)', '', 0, 1000000, 0.01],
      budget: ['Monthly budget', 'Budget (₱)', '', 0.01, 1000000, 0.01]
    };
    if (!Object.hasOwn(options, key)) return;
    const [title, label, note, min, max, step] = options[key];
    const view = modal(title, `<form class="kt-form" id="kt-setting">
      ${field('value', label, read()[key], `type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}"`)}
      ${note ? `<p class="kt-note">${note}</p>` : ''}
      ${key === 'bill' ? '<div class="kt-result"><span>App estimate</span><strong id="kt-bill-estimate"></strong><small id="kt-bill-difference" aria-live="polite"></small></div>' : ''}
      </form>`, primary('Save', 'kt-setting'));
    const form = view.querySelector('form');
    if (key === 'bill') {
      const estimate = read().appliances.reduce((sum, item) => sum + window.Energy.kwh(item), 0) * read().rate;
      view.querySelector('#kt-bill-estimate').textContent = peso.format(estimate);
      function compare() {
        const diff = estimate - form.elements.value.valueAsNumber;
        const valid = form.elements.value.validity.valid;
        view.querySelector('#kt-bill-difference').textContent = valid
          ? (Math.abs(diff) < 0.005 ? 'Matches your bill' : `${peso.format(Math.abs(diff))} ${diff > 0 ? 'above' : 'below'} your actual bill`) : '';
      }
      form.elements.value.oninput = compare;
      compare();
    }
    form.onsubmit = event => {
      event.preventDefault();
      read()[key] = form.elements.value.valueAsNumber;
      dialog.close();
      window.Kuryentipid.commit('Changes saved');
    };
  }

  function openReset() {
    const view = modal('Reset household data?',
      '<p class="kt-description">Restore the example household? This clears your profile, saved appliances and icons, history, bill, budget, goals, and preferences from this browser.</p>',
      '<button type="button" class="kt-secondary" data-keep>Cancel</button><button type="button" class="kt-danger" data-reset>Reset data</button>');
    view.querySelector('[data-keep]').onclick = () => dialog.close();
    view.querySelector('[data-reset]').onclick = () => {
      const state = read();
      Object.keys(state).forEach(key => { delete state[key]; });
      Object.assign(state, window.Energy.defaults());
      dialog.close();
      window.Kuryentipid.commit('Household data reset');
    };
  }

  function openCatalog(categoryName) { choosePreset({ category: categoryName }); }
  window.ApplianceUI = { openEditor, openCatalog, openDetail, openTips, openCalculator, openSetting, openReset };
})();
