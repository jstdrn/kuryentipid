/* Household forecasts cover 30 days; manual readings refer to a local calendar month. */
window.BudgetAlerts = (() => {
  'use strict';

  const historyLimit = 40;
  const money = new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 2,
  });
  const amount = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 });
  let registrationPromise;

  function number(value, fallback) {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function config(state) {
    const given = state.alerts && typeof state.alerts === 'object' ? state.alerts : {};
    const customPercent = number(given.budgetPercent, 80);
    return {
      enabled: (given.enabled ?? state.budgetAlerts) === true,
      budgetPercent: Math.min(100, Math.max(1, customPercent)),
      energyLimit: Math.max(0, number(given.energyLimit, 0)),
      deviceEnabled: given.deviceEnabled === true,
    };
  }

  function makeAlert(kind, title, message, time) {
    const id = window.crypto?.randomUUID?.() || kind + '-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    return { id, kind, title, message, time, read: false };
  }

  function recordedUse(items, month) {
    let total = null;
    for (const item of items) {
      if (!Array.isArray(item?.monthlyReadings)) continue;
      // The history editor keeps the last valid entry per appliance and month.
      let reading;
      for (const entry of item.monthlyReadings) {
        if (entry?.month === month && Number.isFinite(entry.kwh) && entry.kwh >= 0) reading = entry.kwh;
      }
      if (reading !== undefined) total = (total ?? 0) + reading;
    }
    return total;
  }

  function energyMessage(use, limit, label) {
    const over = (Math.round(use * 100) - Math.round(limit * 100)) / 100;
    return over > 0
      ? `Your ${label} use of ${amount.format(use)} kWh is ${amount.format(over)} kWh over your ${amount.format(limit)} kWh monthly limit.`
      : `Your ${label} use has reached your ${amount.format(limit)} kWh monthly limit.`;
  }

  function evaluate(state, summary, now = new Date()) {
    const settings = config(state);
    state.alerts = settings;
    const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const time = now.toISOString();
    const previous = state.alertStatus?.month === month ? state.alertStatus : {};
    const active = settings.enabled && Array.isArray(state.appliances) && state.appliances.length > 0;
    const budget = number(state.budget, 0);
    const cost = number(summary?.cost, 0);
    const use = number(summary?.kwh, 0);
    const hasBudget = active && budget > 0 && cost > 0;
    const full = hasBudget && cost >= budget;
    const warning = hasBudget && settings.budgetPercent < 100 && cost >= budget * settings.budgetPercent / 100;
    const energy = active && settings.energyLimit > 0 && use >= settings.energyLimit;
    const measured = active && settings.energyLimit > 0 ? recordedUse(state.appliances, month) : null;
    const recorded = measured !== null && measured >= settings.energyLimit;
    const fresh = [];

    if (full && !previous.full) {
      const over = (Math.round(cost * 100) - Math.round(budget * 100)) / 100;
      const message = over > 0
        ? `Your ${money.format(cost)} estimate is ${money.format(over)} over your ${money.format(budget)} monthly budget.`
        : `Your ${money.format(cost)} estimate has reached your monthly budget.`;
      fresh.push(makeAlert('budget-full', 'Monthly budget reached', message, time));
    } else if (warning && !previous.warning && !full) {
      const remaining = (Math.round(budget * 100) - Math.round(cost * 100)) / 100;
      fresh.push(makeAlert('budget-warning', `${amount.format(settings.budgetPercent)}% budget alert`,
        `Your estimated cost is ${money.format(cost)}, leaving ${money.format(remaining)} in your ${money.format(budget)} monthly budget.`, time));
    }
    if (recorded && !previous.recorded) {
      fresh.push(makeAlert('recorded-energy', 'Recorded energy limit reached',
        energyMessage(measured, settings.energyLimit, 'recorded'), time));
    } else if (energy && !previous.energy) {
      fresh.push(makeAlert('energy', 'Estimated energy limit reached',
        energyMessage(use, settings.energyLimit, 'estimated'), time));
    }
    state.alertStatus = { month, warning, full, energy, recorded };
    const history = Array.isArray(state.alertHistory) ? state.alertHistory : [];
    state.alertHistory = [...fresh, ...history].slice(0, historyLimit);
    return fresh;
  }

  function support() {
    try {
      const api = window.Notification;
      const webPage = ['http:', 'https:'].includes(window.location.protocol);
      const supported = !!api && webPage && window.isSecureContext === true && typeof api.requestPermission === 'function';
      return { supported, permission: supported ? api.permission : 'unsupported' };
    } catch {
      return { supported: false, permission: 'unsupported' };
    }
  }

  // Invoke from an explicit button click. evaluate and deliver never request permission.
  async function requestPermission() {
    const { supported, permission } = support();
    if (!supported || permission !== 'default') return permission;
    try {
      return await window.Notification.requestPermission();
    } catch {
      return support().permission;
    }
  }

  async function workerRegistration() {
    if (!window.navigator.serviceWorker) return null;
    if (!registrationPromise) {
      registrationPromise = (async () => {
        const workerUrl = new URL('notification-sw.js', window.location.href);
        const registration = await window.navigator.serviceWorker.register(workerUrl.href);
        if (registration.active) return registration;
        const worker = registration.installing || registration.waiting;
        if (!worker) return null;
        return new Promise(resolve => {
          function finish(result) {
            clearTimeout(timeout);
            worker.removeEventListener('statechange', onChange);
            resolve(result);
          }
          function onChange() {
            if (worker.state === 'activated') finish(registration);
            else if (worker.state === 'redundant') finish(null);
          }
          const timeout = setTimeout(() => finish(null), 5000);
          worker.addEventListener('statechange', onChange);
          onChange();
        });
      })().catch(() => null);
    }
    const registration = await registrationPromise;
    if (!registration) registrationPromise = undefined;
    return registration;
  }

  async function deliver(state, alerts) {
    const settings = config(state);
    if (!settings.enabled || !settings.deviceEnabled || !alerts?.length || support().permission !== 'granted') return 0;
    const destination = new URL(window.location.href);
    destination.hash = 'notifications';
    const registration = await workerRegistration();
    let delivered = 0;
    for (const alert of alerts) {
      const options = {
        body: alert.message,
        tag: 'kuryentipid-' + alert.kind,
        icon: new URL('assets/brandmark.svg', destination).href,
        data: { url: destination.href },
      };
      try {
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(alert.title, options);
        } else {
          const notification = new window.Notification(alert.title, options);
          notification.onclick = () => {
            window.focus();
            window.location.hash = 'notifications';
            notification.close();
          };
        }
        delivered++;
      } catch {
        // Permission can change at any time. The alert is already in the in-app history.
      }
    }
    return delivered;
  }

  return Object.freeze({ config, evaluate, support, requestPermission, deliver });
})();
