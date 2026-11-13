/* Classic script so the dashboard also works when index.html is opened from disk. */
window.Energy = (() => {
  'use strict';

  const storageKey = 'kuryentipid-state';
  // Generic records match the data shape used by earlier releases. They are
  // never used to attribute a user's existing appliance to a specific model.
  const legacyTypes = [
    ['ac', 'AC', 'Air conditioner', 'Window AC · 1.0 HP', 700, 8, 7],
    ['fridge', 'RF', 'Refrigerator', 'Two-door · inverter', 150, 14, 7],
    ['rice', 'RC', 'Rice cooker', 'Standard · 1.0 L', 833, 2, 7],
    ['washer', 'WM', 'Washing machine', 'Top load · 7 kg', 700, 2.8, 5],
    ['tv', 'TV', 'Television', 'LED · 43 inch', 113, 10, 7],
    ['fan', 'FN', 'Electric fan', 'Stand fan', 210, 10, 7],
    ['other', 'OT', 'Other appliance', '', 300, 2, 7],
  ];
  const presets = Object.freeze(legacyTypes.map(([id, icon, name, detail, watts, hours, days]) =>
    Object.freeze({ id, icon, name, detail, watts, hours, days, quantity: 1 })
  ));

  const models = new Map(window.ApplianceCatalog.map(model => [model.id, model]));

  // Hours and days below are illustrative household schedules. The catalog
  // contains manufacturer/DOE ratings only, with no assumptions about usage.
  const exampleHome = [
    ['ac', 'pana-pu9wkq', 'Air conditioner', 8, 7],
    ['fridge', 'fuji-ibm12ss2', 'Refrigerator', 24, 7],
    ['rice', 'philips-hd4515', 'Rice cooker', 0.5, 7],
    ['washer', 'sharp-estl7010p', 'Washing machine', 1, 3],
    ['tv', 'samsung-u8000f', 'Television', 4, 7],
    ['fan', 'pana-f405ss', 'Electric fan', 8, 7],
  ];

  function labelConsumption(item) {
    const product = models.get(item?.catalogId);
    if (product?.monthlyKwh > 0) return { value: product.monthlyKwh, unit: 'kWh/month' };
    if (product?.annualKwh > 0) return { value: product.annualKwh, unit: 'kWh/year' };
    return null;
  }

  function defaults() {
    return {
      rate: 12,
      bill: 4600,
      budget: 7500,
      checkedDays: [],
      appliances: exampleHome.map(([id, catalogId, name, hours, days]) => {
        const product = models.get(catalogId);
        return {
          id, catalogId, name, icon: product.icon, detail: product.brand + ' ' + product.model,
          watts: product.watts, hours, days, quantity: 1,
        };
      }),
    };
  }

  function numberWithin(value, min, max, fallback) {
    if (typeof value !== 'number' && typeof value !== 'string') return fallback;
    if (typeof value === 'string' && !value.trim()) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
  }

  function newId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function normalizeAppliances(items) {
    const used = new Set();
    const result = [];
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const preset = presets.find(option => option.icon === item.icon) || presets.at(-1);
      const product = models.get(item.catalogId);
      const label = labelConsumption(item);
      const id = typeof item.id === 'string' && item.id && !used.has(item.id) ? item.id : newId();
      used.add(id);
      result.push({
        ...item, id,
        icon: typeof item.icon === 'string' && item.icon ? item.icon : product?.icon || preset.icon,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : preset.name,
        detail: typeof item.detail === 'string' ? item.detail : preset.detail,
        watts: label ? null : numberWithin(item.watts, 0, 20000, product?.watts ?? preset.watts),
        hours: label ? 24 : numberWithin(item.hours, 0, 24, preset.hours),
        days: label ? 7 : Math.round(numberWithin(item.days, 0, 7, preset.days)),
        quantity: Math.round(numberWithin(item.quantity, 1, 50, 1)),
      });
    }
    return result;
  }

  function load() {
    const base = defaults();
    let stored;
    try {
      stored = JSON.parse(window.localStorage.getItem(storageKey));
    } catch {
      return base;
    }
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return base;
    const checkedDays = Array.isArray(stored.checkedDays) ? stored.checkedDays : [];
    return {
      ...base, ...stored,
      rate: numberWithin(stored.rate, 0.01, 500, base.rate),
      bill: numberWithin(stored.bill, 0, 1000000, base.bill),
      budget: numberWithin(stored.budget, 0, 1000000, base.budget),
      checkedDays: [...new Set(checkedDays.filter(day => Number.isInteger(day) && day >= 0 && day < 7))],
      appliances: Array.isArray(stored.appliances) ? normalizeAppliances(stored.appliances) : base.appliances,
    };
  }

  function save(state) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  // Weekly frequency weights the daily use. The reference uses a 30-day billing period.
  function kwh(item, periodDays = 30) {
    if (!item) return 0;
    const quantity = numberWithin(item.quantity, 1, 50, 1);
    const label = labelConsumption(item);
    if (label) {
      const labelDays = label.unit === 'kWh/month' ? 30 : 365;
      return label.value * periodDays / labelDays * quantity;
    }
    const watts = numberWithin(item.watts, 0, 20000, 0);
    const hours = numberWithin(item.hours, 0, 24, 0);
    const days = numberWithin(item.days, 0, 7, 7);
    return watts / 1000 * hours * days / 7 * periodDays * quantity;
  }

  function summary(state, periodDays = 30) {
    const ranked = state.appliances.map(item => {
      const use = kwh(item, periodDays);
      return { ...item, kwh: use, cost: use * state.rate };
    }).sort((first, second) => second.kwh - first.kwh);
    const total = ranked.reduce((sum, item) => sum + item.kwh, 0);
    for (const item of ranked) item.share = total > 0 ? item.kwh / total * 100 : 0;
    return { kwh: total, cost: total * state.rate, ranked };
  }

  function saving(item, rate, targetHours, periodDays = 30) {
    if (!item || labelConsumption(item)) return { kwh: 0, cost: 0 };
    const target = numberWithin(targetHours, 0, 24, item.hours);
    const hoursSaved = Math.max(0, item.hours - target);
    const use = kwh({ ...item, hours: hoursSaved }, periodDays);
    return { kwh: use, cost: use * rate };
  }

  return Object.freeze({ load, save, defaults, presets, newId, kwh, summary, saving, labelConsumption });
})();
