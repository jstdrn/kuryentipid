/* All estimates use the same saved appliance schedule and local electricity rate. */
'use strict';

const state = Energy.load();
const app = document.querySelector('#app');
const views = {home: 'Home', analytics: 'Analytics', appliances: 'Appliances', profile: 'Profile', settings:'Settings', about:'About us', savings: 'Savings goal', notifications:'Notifications'};
const tabs = [['home','home'], ['analytics','activity'], ['appliances','plug'], ['profile','user']];
const price = new Intl.NumberFormat('en-PH', {style:'currency',currency:'PHP',maximumFractionDigits:0,minimumFractionDigits:0});
const rateFormat = new Intl.NumberFormat('en-PH', {minimumFractionDigits:2,maximumFractionDigits:3});
const units = new Intl.NumberFormat('en-PH', {maximumFractionDigits:1});
const dateLabel = new Intl.DateTimeFormat('en-PH', {month:'long',day:'numeric',year:'numeric'}).format(new Date());
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash = n => price.format(n);
const rate = () => '₱' + rateFormat.format(state.rate);
let currentView = 'home';
let search = '';
let period = 'month';
let rankingUnit = 'kwh';
let toastTimer;

function notify(message) {
  const el = document.querySelector('#feedback');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2600);
}
function commit(message) {
  const raised = BudgetAlerts.evaluate(state, Energy.summary(state));
  const saved = Energy.save(state);
  render();
  if (!saved) notify('Changes are available for this visit. Browser storage is unavailable.');
  else if (raised.length) announceAlerts(raised);
  else if (message) notify(message);
}
function announceAlerts(raised) {
  notify(raised.map(entry=>entry.title).join(' · '));
  void BudgetAlerts.deliver(state, raised).catch(()=>{});
}
// Check limits on return as well as on an edit, including the first visit in a new month.
function checkAlerts() {
  const before = JSON.stringify([state.alerts,state.alertStatus,state.alertHistory]);
  const raised = BudgetAlerts.evaluate(state, Energy.summary(state));
  if (before !== JSON.stringify([state.alerts,state.alertStatus,state.alertHistory])) {
    Energy.save(state);
    render();
  }
  if (raised.length) announceAlerts(raised);
}
function navigate(view) {
  const target = ({dashboard:'home',insights:'analytics'}[view] || view);
  if (!Object.hasOwn(views, target)) return;
  if (location.hash !== '#' + target) location.hash = target;
  else showView(target);
}
function showView(view, animate = true) {
  currentView = Object.hasOwn(views,view) ? view : 'home';
  search = '';
  render();
  if (animate) {
    document.querySelector('main').classList.add('page-arrival');
    document.querySelector('main').focus({preventScroll:true});
  }
  window.scrollTo({top:0,behavior:'instant'});
}
window.Kuryentipid = {getState:() => state, commit, navigate};

function navLink(key, symbol) {
  const active = currentView === key || (key === 'profile' && ['savings','settings','about'].includes(currentView));
  return `<a href="#${key}" class="nav-link${active?' selected':''}" ${active?'aria-current="page"':''}>${icon(symbol,21)}<span>${views[key]}</span></a>`;
}
function logo() {
  return '<a class="brand" href="#home" aria-label="Kuryentipid home"><img src="assets/wordmark.svg" alt="Kuryentipid"></a>';
}
function header() {
  const links = tabs.map(([key,symbol]) => navLink(key,symbol));
  const unseen = (state.alertHistory || []).filter(entry=>!entry.read).length;
  const bell = `<a href="#notifications" class="inbox-link" aria-label="Notifications${unseen?', '+unseen+' unread':''}" ${currentView==='notifications'?'aria-current="page"':''}>${icon('bell',21)}${unseen?'<span class="unread-dot"></span>':''}</a>`;
  return `<header class="site-header"><div class="header-inner">${logo()}<div class="header-actions"><nav class="desktop-nav" aria-label="Main">${links.join('')}</nav>${bell}</div></div></header>
    <nav class="bottom-nav" aria-label="Main mobile">${links[0]}${links[1]}<button class="nav-add" data-action="add" aria-label="Add appliance">${icon('plus',28)}</button>${links[2]}${links[3]}</nav>`;
}
const addButton = () => `<button class="primary add-main" data-action="add">${icon('plus',18)}Add appliance</button>`;
function heading(title, actions = '', sub = '') {
  return `<div class="page-head"><div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>${actions}</div>`;
}
function monthSummary(data) {
  const top = data.ranked[0];
  const consuming = data.ranked.filter(item=>item.kwh>0);
  const shares = consuming.length>6
    ? [...consuming.slice(0,5),{name:'Other appliances',kwh:consuming.slice(5).reduce((sum,item)=>sum+item.kwh,0)}]
    : consuming;
  const describeShare = item=>item.name+' '+units.format(item.kwh/data.kwh*100)+'%';
  const fraction = state.budget > 0 ? data.cost / state.budget : 0;
  const percent = Math.round(fraction * 100);
  return `<section class="hero" aria-label="Household estimate">
    <div class="hero-main"><div><h2>${icon('bolt',18)} Estimated monthly use</h2>
    <div class="metric">${units.format(data.kwh)} <span>kWh</span></div>
    <p class="hero-cost"><strong>${cash(data.cost)}</strong> <span>per 30 days</span></p></div>
    <button class="budget-dial" data-go="savings" aria-label="View savings goal, ${percent}% of budget">
      <svg viewBox="0 0 108 108" aria-hidden="true"><circle cx="54" cy="54" r="46" class="dial-track"/>
      <circle cx="54" cy="54" r="46" pathLength="100" stroke-dasharray="${Math.min(100,fraction*100)} 100" class="dial-value"/></svg>
      <span><strong>${state.budget?percent+'%':'—'}</strong><small>of budget</small></span></button></div>
    <div class="hero-foot">${shares.length?`<div class="share-strip" role="img" aria-label="Share of monthly consumption. ${esc(shares.map(describeShare).join(', '))}">${shares.map((item,index)=>`<span style="flex-grow:${item.kwh/data.kwh*100};background:var(--band-${index})" title="${esc(describeShare(item))}"></span>`).join('')}</div>`:''}
    ${top&&top.kwh>0?`<button data-detail="${esc(top.id)}"><span>Largest share</span><b>${esc(top.name)} · ${Math.round(top.share)}%</b>${icon('chevronRight',15)}</button>`:'<span>Add an appliance to estimate use.</span>'}</div>
    ${heroInsight(data)}</section>`;
}
function heroInsight(data) {
  if (!(data.kwh > 0)) return '';
  const lines = [];
  if (state.budget > 0) {
    const gap = state.budget - data.cost;
    lines.push(gap >= 0
      ? `On track: about <strong>${cash(gap)}</strong> under your ${cash(state.budget)} budget.`
      : `Heads up: about <strong>${cash(-gap)}</strong> over your ${cash(state.budget)} budget.`);
  }
  const target = data.ranked.find(item => item.kwh > 0 && item.hours >= 1 && !Energy.labelConsumption(item));
  if (target) {
    const saved = Energy.saving(target, state.rate, target.hours - 1);
    if (saved.cost >= 1) lines.push(`Use ${esc(target.name.toLowerCase())} 1 hour less a day and save about <strong>${cash(saved.cost)}</strong> a month.`);
  }
  return lines.length ? `<p class="hero-insight">${icon('bolt',16)}<span>${lines.join(' ')}</span></p>` : '';
}
function rateCard() {
  return `<section class="rate-card"><div class="rate-title"><span class="rate-icon">${icon('bill',18)}</span><h2>Electricity rate</h2></div><button class="rate-edit" data-setting="rate" aria-label="Edit electricity rate, ${rate()} per kilowatt-hour"><strong>${rate()}</strong><span>/ kWh</span>${icon('edit',16)}</button>
    <div class="rate-foot"><span>Last bill</span><button data-setting="bill">${cash(state.bill)} ${icon('chevronRight',15)}</button></div></section>`;
}
function homeItems() {
  const priority = ['ac','fridge','washer','fan'];
  return [...state.appliances].sort((a,b)=>(priority.includes(a.id)?priority.indexOf(a.id):4)-(priority.includes(b.id)?priority.indexOf(b.id):4)).slice(0,4);
}
function isOn(item) { return item.active ?? item.id !== 'washer'; }
function itemRow(item, home) {
  const active = isOn(item);
  const model = lookupModel(item);
  const rating = item.watts == null ? `${units.format(Energy.kwh(item))} kWh/mo` : `${units.format(item.watts)} W`;
  const descriptor = model ? [model.brand, model.model].filter(Boolean).join(' ') : item.detail;
  const subtitle = home ? `<span class="status ${active?'on':''}"><i></i>${active?'Active':'Inactive'}${descriptor?' · '+esc(descriptor):''}</span>` :
    `<span class="row-meta">${esc(descriptor || 'Custom appliance')} · ${rating}</span>`;
  return `<div class="device-row"><button class="device-link" data-detail="${esc(item.id)}"><span class="device-icon" data-type="${esc(item.displayIcon || item.icon)}">${applianceIcon(item,25)}</span><span class="device-label"><strong>${esc(item.name)}</strong>${subtitle}</span>${home?'':`<span class="row-cost">${cash(Energy.kwh(item)*state.rate)}<small>/ month</small></span>${icon('chevronRight',16)}`}</button>
    ${home?`<button role="switch" aria-checked="${active}" aria-label="${esc(item.name)} active" data-switch="${esc(item.id)}" class="switch-hit"><span class="switch"><i></i></span></button>`:''}</div>`;
}
function emptyList() {
  return `<div class="empty panel"><p>No appliances yet.</p>${addButton()}</div>`;
}

// Project the saved household schedule over the selected period. Label-based
// devices use their published energy consumption instead of assumed run hours.
const periods = {
  day: {label: 'Day', days: 1},
  week: {label: 'Week', days: 7},
  month: {label: 'Month', days: 30}
};

const modelById = new Map(window.ApplianceCatalog.map(model => [model.catalogId || model.id, model]));
function lookupModel(item) {
  return item.catalogId ? modelById.get(item.catalogId) : undefined;
}
function categoryOf(item) {
  const code = lookupModel(item)?.icon || item.icon;
  const groups = {
    AC:'Cooling', FN:'Cooling', RF:'Kitchen', RC:'Kitchen', KT:'Kitchen',
    TO:'Kitchen', AF:'Kitchen', MW:'Kitchen', IH:'Kitchen', BL:'Kitchen',
    WM:'Home care', IR:'Home care', VC:'Home care', LT:'Lighting',
    NW:'Internet & office', MN:'Internet & office', PR:'Internet & office', TV:'Entertainment'
  };
  return groups[code] || 'Other';
}
function usageGroups(days) {
  const groupTotals = new Map();
  for (const item of state.appliances) {
    const group = categoryOf(item);
    groupTotals.set(group, (groupTotals.get(group) || 0) + Energy.kwh(item, days));
  }
  return [...groupTotals].filter(([,kwh]) => kwh > 0).sort((a,b) => b[1] - a[1]);
}
function periodControl() {
  const options = Object.entries(periods).map(([id,option]) =>
    `<button data-period="${id}" aria-pressed="${id===period}">${option.label}</button>`
  );
  return `<div class="segments" role="group" aria-label="Estimate period">${options.join('')}</div>`;
}
function reportCard(compact = false) {
  const days = periods[period].days;
  const groups = usageGroups(days);
  const total = groups.reduce((sum, [,kwh]) => sum + kwh, 0);
  const visible = compact ? groups.slice(0,3) : groups;
  const others = total - visible.reduce((sum, [,kwh]) => sum+kwh, 0);
  if (compact && others > 0.001) visible.push(['Remaining groups',others]);
  return `<article class="report-panel panel"><div class="report-top"><h2>Usage by category</h2>${icon('chart',20)}</div>
    ${periodControl()}<div class="report-value"><p class="report-number">${units.format(total)} <span>kWh</span></p>
    <span>${cash(total*state.rate)} estimated</span></div>
    <div class="mix-list">${visible.map(([name,kwh],idx) => `<div class="mix-row" style="--mix:var(--band-${Math.min(idx,5)})">
      <span>${esc(name)}</span><strong>${Math.round(kwh/total*100)}%</strong>
      <span class="mix-track" aria-hidden="true"><i style="width:${kwh/total*100}%"></i></span></div>`).join('') || '<p class="no-usage">Set an appliance schedule to see usage.</p>'}</div>
    ${compact?`<a class="report-link" href="#analytics">View energy report ${icon('arrowRight',16)}</a>`:'<small class="estimate-basis">Based on appliance settings and published energy ratings.</small>'}</article>`;
}
function catalogRail() {
  const categories = new Map();
  for (const model of window.ApplianceCatalog) {
    if (!categories.has(model.category)) categories.set(model.category, model.icon);
  }
  const shortcuts = ['Air conditioner','Refrigerator','Rice cooker','Networking','Lighting'];
  const buttons = shortcuts.filter(category=>categories.has(category)).map(category =>
    `<button class="category-link" data-category="${esc(category)}"><span class="category-icon" data-type="${esc(categories.get(category))}">${applianceIcon({icon:categories.get(category)},23)}</span>${esc(category)}</button>`
  );
  return `<section class="catalog-rail"><div class="section-head"><h2>Appliance catalog</h2>
    <button class="subtle-action" data-action="add">All ${window.ApplianceCatalog.length} models ${icon('chevronRight',15)}</button></div>
    <div class="category-rail" aria-label="Browse catalog by category">${buttons.join('')}</div></section>`;
}
function homePage(data) {
  const unread = BudgetAlerts.config(state).enabled && (state.alertHistory || []).find(entry=>!entry.read);
  const budgetAlert = unread ? `<a href="#notifications" class="budget-alert">${icon('bell',18)}<strong>${esc(unread.title)}</strong><span>View alerts ${icon('chevronRight',15)}</span></a>` : '';
  return `${heading('Home overview',addButton(),dateLabel)}${budgetAlert}<div class="home-grid">${monthSummary(data)}${rateCard()}
    <section class="home-appliances"><div class="section-head"><h2>My appliances</h2><a href="#appliances">See all ${icon('chevronRight',16)}</a></div>
    <div class="device-list">${homeItems().map(item=>itemRow(item,true)).join('') || emptyList()}</div></section>
    <div class="home-report">${reportCard(true)}</div></div>${catalogRail()}`;
}
function filterItems() {
  const text = search.trim().toLowerCase();
  return state.appliances.filter(item => {
    const model = lookupModel(item);
    return [item.name,item.detail,model?.model,model?.brand,categoryOf(item)].join(' ').toLowerCase().includes(text);
  });
}
function filteredList() {
  const items = filterItems();
  return items.length ? items.map(item=>itemRow(item,false)).join('') :
    '<p class="empty panel">No matching appliances.</p>';
}
function appliancesPage() {
  return `${heading('Appliances',addButton())}${catalogRail()}<section class="library">
    <div class="section-head"><h2>My appliances</h2><span>${state.appliances.length} total</span></div>
    <label class="searchbox">${icon('search',20)}<input id="search" type="search" aria-label="Search my appliances" placeholder="Search my appliances" value="${esc(search)}"></label>
    <div id="devices" class="library-list">${state.appliances.length?filteredList():emptyList()}</div></section>`;
}
function rankedUsage() {
  const days = periods[TrendChart.getPeriod()].days;
  const data = Energy.summary(state, days);
  const showCost = rankingUnit === 'peso';
  return `<div class="report-top"><h2>Ranked by consumption</h2><span class="table-caption">${days} ${days === 1 ? 'day' : 'days'}</span></div>
    <div class="breakdown">${data.ranked.map(item=>`<button data-detail="${esc(item.id)}">
      <span class="break-icon" data-type="${esc(item.icon)}">${applianceIcon(item,19)}</span><span class="break-name">${esc(item.name)}<small>${Math.round(item.share)}% of household use</small></span>
      <b>${showCost?cash(item.cost):units.format(item.kwh)+' kWh'}</b>${icon('chevronRight',15)}</button>`).join('') || '<p>No appliances yet.</p>'}</div>
    <div class="analytics-total"><span>Total estimate</span><strong>${showCost?cash(data.cost):units.format(data.kwh)+' kWh'}</strong></div>`;
}
function analyticsPage() {
  return `${heading('Energy report',`<button class="secondary" data-action="calculator">${icon('bolt',17)}Savings calculator</button>`)}
    <div class="analytics-layout"><div class="analytics-trend">${TrendChart.render({unit:rankingUnit})}</div>
    <section class="usage-table panel" id="usage-ranking">${rankedUsage()}</section></div>
    <div class="analytics-categories">${reportCard()}</div>`;
}

function settingRow(label,value,attrs) {
  return `<button class="setting" ${attrs}><span>${label}</span><b>${value}</b>${icon('chevronRight',17)}</button>`;
}
function settingsPage() {
  return `<a class="back-link" href="#profile">${icon('back',15)} Profile</a>${heading('Settings')}<div class="preferences"><section><h2>Preferences</h2><div class="panel settings-list">
    ${settingRow('Electricity rate',rate()+'/kWh','data-setting="rate"')}
    ${settingRow('Compare with your bill',cash(state.bill),'data-setting="bill"')}
    ${settingRow('Monthly budget',cash(state.budget),'data-setting="budget"')}
    <button class="setting" role="switch" aria-label="Dark mode" aria-checked="${state.theme!=='light'}" data-action="theme"><span>Dark mode</span><span class="switch"><i></i></span></button>
    ${settingRow('Notifications',BudgetAlerts.config(state).enabled?'On':'Off','data-go="notifications"')}
    </div></section><section><h2>Help &amp; support</h2><div class="panel settings-list">
    ${settingRow('Tips & tricks','','data-action="tips"')}${settingRow('About us','','data-go="about"')}
    <details class="help-row"><summary>Privacy</summary><p>Your appliances, profile, icons and goals stay in this browser’s local storage. Reset saved data restores the example household and clears your profile.</p></details>
    <details class="help-row"><summary>Frequently asked questions</summary><p><strong>Where do model ratings come from?</strong> Open an appliance’s details for its manufacturer specification or energy label.</p><p><strong>Why is my bill different?</strong> The estimate uses your schedule, power rating and local rate. Actual run time, fees and billing days can differ.</p></details></div></section>
    <section><h2>Device data</h2><div class="panel settings-list">${settingRow('Reset saved data','','data-action="reset"')}</div></section></div>`;
}
function profilePortrait(name, photo) {
  if (LocalPhoto.isSavedPng(photo, 256 * 1024)) return `<img src="${photo}" alt="">`;
  return esc((name.trim() || 'My household').split(/\s+/).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase());
}
function profilePage() {
  const person = state.profile || {};
  const name = person.name || 'My household';
  return `${heading('Profile')}<div class="profile-layout"><section class="identity panel">
    <div class="identity-banner"></div><div class="identity-body"><span class="identity-avatar" aria-hidden="true">${profilePortrait(name, person.photo)}</span>
    <h2>${esc(name)}</h2><p>${esc(person.email || 'Local profile')}</p>
    ${person.phone?`<p>${esc(person.phone)}</p>`:''}<button class="text-action" data-action="edit-profile">${icon('edit',15)} Edit profile</button></div></section>
    <div class="profile-stack"><section><h2>My household</h2><div class="panel settings-list">
    ${settingRow('Settings','','data-go="settings"')}${settingRow('Savings goal','','data-go="savings"')}${settingRow('Savings calculator','','data-action="calculator"')}</div></section>
    <section><h2>Support</h2><div class="panel settings-list">${settingRow('Tips & tricks','','data-action="tips"')}${settingRow('About us','','data-go="about"')}</div></section></div></div>`;
}
function editProfile() {
  const person = state.profile || {};
  let draftPhoto = LocalPhoto.isSavedPng(person.photo, 256 * 1024) ? person.photo : '';
  let revision = 0;
  const dialog = document.createElement('dialog');
  dialog.className='kt-dialog';
  dialog.setAttribute('aria-labelledby','profile-title');
  dialog.innerHTML=`<header class="kt-head"><h2 id="profile-title">Edit profile</h2><button class="kt-icon-button" type="button" aria-label="Close">${icon('close',21)}</button></header>
    <form class="kt-body kt-form" id="household-profile"><section class="profile-picture" aria-labelledby="picture-label">
    <span class="identity-avatar" data-profile-preview aria-hidden="true"></span><div><h3 id="picture-label">Profile picture</h3>
    <div class="picture-actions"><button type="button" data-choose-photo></button>
    <button type="button" data-remove-photo>Remove</button></div>
    <input type="file" hidden accept="image/png,image/jpeg,image/webp" aria-label="Profile picture"></div>
    <small class="kt-note" data-picture-status role="status">JPEG, PNG or WebP · up to 10 MB</small></section>
    <label class="kt-field"><span>Display name</span><input name="name" maxlength="50" required autocomplete="nickname" value="${esc(person.name || 'My household')}" placeholder="Your name or household"></label>
    <label class="kt-field"><span>Email (optional)</span><input type="email" maxlength="160" autocomplete="email" name="email" value="${esc(person.email)}"></label>
    <label class="kt-field"><span>Phone (optional)</span><input type="tel" maxlength="35" autocomplete="tel" name="phone" value="${esc(person.phone)}"></label>
    <small class="kt-note">Saved on this device.</small></form><footer class="kt-footer"><button form="household-profile" class="kt-primary">Save profile</button></footer>`;
  document.body.append(dialog);
  document.documentElement.classList.add('kt-modal-open');
  dialog.addEventListener('close',()=>{
    document.documentElement.classList.remove('kt-modal-open');
    dialog.remove();
    app.querySelector('[data-action="edit-profile"]')?.focus();
  },{once:true});
  dialog.querySelector('header button').onclick=()=>dialog.close();
  const form = dialog.querySelector('form');
  const fileInput = form.querySelector('input[type=file]');
  const choose = form.querySelector('[data-choose-photo]');
  const remove = form.querySelector('[data-remove-photo]');
  const status = form.querySelector('[data-picture-status]');
  const save = dialog.querySelector('button[form="household-profile"]');
  const preview = form.querySelector('[data-profile-preview]');
  function refreshPhoto() {
    preview.innerHTML = profilePortrait(form.elements.name.value, draftPhoto);
    choose.textContent = draftPhoto ? 'Change photo' : 'Choose photo';
    remove.hidden = !draftPhoto;
  }
  refreshPhoto();
  form.elements.name.addEventListener('input',()=>{if (!draftPhoto) refreshPhoto();});
  choose.onclick = ()=>fileInput.click();
  remove.onclick = ()=>{
    revision++;
    draftPhoto = '';
    save.disabled = false;
    refreshPhoto();
    choose.focus();
    status.textContent = 'Photo removed. Save to apply.';
  };
  fileInput.onchange = async ()=>{
    const file = fileInput.files[0];
    if (!file) return;
    fileInput.value = '';
    const request = ++revision;
    save.disabled = true;
    status.textContent = 'Preparing photo…';
    try {
      const photo = await LocalPhoto.resize(file, {side:224, square:true, maxMB:10, maxMP:50});
      if (request !== revision || !dialog.open) return;
      draftPhoto = photo;
      refreshPhoto();
      status.textContent = 'Photo ready. Save to apply.';
    } catch (error) {
      if (request === revision && dialog.open) status.textContent = error.message || 'Choose another photo.';
    } finally {
      if (request === revision) save.disabled = false;
    }
  };
  form.onsubmit=event=>{
    event.preventDefault();
    if (save.disabled) return;
    const inputs=event.currentTarget.elements;
    if (!inputs.name.value.trim()) {inputs.name.focus();return;}
    state.profile={name:inputs.name.value.trim(),email:inputs.email.value.trim(),phone:inputs.phone.value.trim(),photo:draftPhoto};
    dialog.close();
    commit('Profile saved');
  };
  dialog.showModal();
}
function notificationsPage() {
  const config = BudgetAlerts.config(state);
  const support = BudgetAlerts.support();
  const onDevice = config.deviceEnabled && support.permission === 'granted';
  const canEnable = support.supported && support.permission !== 'denied';
  const deviceHelp = !support.supported ? 'Device notifications need a supported browser on HTTPS or localhost.'
    : support.permission === 'denied' ? 'Allow notifications in your browser’s site settings to enable this option.'
    : 'Also show new alerts on this device while the app is running.';
  const latest = state.alertHistory || [];
  const hasUnread = latest.some(entry=>!entry.read);
  const date = new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  const rows = latest.map(entry=>`<li class="notice-entry ${entry.read?'':'unread'}">
    <span class="notice-icon">${icon(entry.kind.includes('energy')?'bolt':'bell',19)}</span><div><h3>${esc(entry.title)}</h3>
    <p>${esc(entry.message)}</p><time datetime="${esc(entry.time)}">${esc(date.format(new Date(entry.time)))}</time></div></li>`).join('');
  return `<a class="back-link" href="#settings">${icon('back',15)} Settings</a>${heading('Notifications')}
    <div class="notice-layout"><section class="panel notice-panel" aria-labelledby="notice-limits"><div class="notice-panel-title">
    <h2 id="notice-limits">Usage alerts</h2><button type="button" class="notice-toggle" role="switch" aria-label="Usage alerts" aria-checked="${config.enabled}" data-action="alerts"><span>${config.enabled?'On':'Off'}</span><span class="switch"><i></i></span></button></div>
    <p class="notice-description">Check my 30-day estimate and this month’s recorded kWh when I open or update the app.</p>
    ${config.enabled?`<form id="notice-limits-form"><label class="kt-field"><span>Monthly budget (₱)</span>
    <input type="number" name="budget" required value="${state.budget}" min="0.01" max="1000000" step="0.01" inputmode="decimal"></label>
    <label class="kt-field"><span>First alert at (% of budget)</span><input type="number" name="percent" required value="${config.budgetPercent}" min="1" max="100" step="1" inputmode="numeric"></label>
    <small>A full-budget alert is included at 100%.</small>
    <label class="kt-field"><span>Monthly energy limit (kWh, optional)</span><input type="number" name="energy" value="${config.energyLimit||''}" min="0.01" max="1000000" step="0.01" inputmode="decimal" placeholder="Enter a limit"></label>
    <button class="primary" type="submit">Save limits</button></form>
    <div class="device-alert-control"><div><strong>Device notifications</strong><p>${deviceHelp}</p></div><button class="notice-toggle" type="button" role="switch" aria-label="Device notifications" aria-checked="${onDevice}" ${canEnable?'':'disabled'} data-action="device-alerts"><span class="switch"><i></i></span></button></div>`:''}
    </section><section class="panel notice-panel" aria-labelledby="recent-alerts"><div class="notice-panel-title"><h2 id="recent-alerts">Recent alerts</h2>
    ${hasUnread?'<button type="button" class="notice-read" data-action="read-alerts">Mark all as read</button>':''}</div>
    ${rows?`<ul class="notice-list">${rows}</ul>`:'<p class="notice-empty">No alerts yet.</p>'}</section></div>`;
}
function savingsPage(data) {
  const goal = state.goal && state.appliances.find(i=>i.id===state.goal.applianceId);
  const baseline = goal ? (state.goal.baselineHours ?? goal.hours) : 0;
  const target = goal ? Math.min(state.goal.targetHours, baseline) : 0;
  const potential = goal ? Energy.saving({...goal, hours:baseline}, state.rate, target).cost : 0;
  const remaining=state.budget-data.cost;
  return `${heading('Savings goal',`<button class="secondary" data-action="calculator">${icon('bolt',17)}Savings calculator</button>`)}
    <div class="preferences"><section><h2>Monthly budget</h2><div class="panel goal-panel"><p>${cash(data.cost)} of ${cash(state.budget)}</p><progress max="${Math.max(1,state.budget)}" value="${Math.min(state.budget,data.cost)}"></progress><div>${cash(Math.abs(remaining))} ${remaining>=0?'under':'over'} budget</div><button class="text-action" data-setting="budget">Edit budget</button></div></section>
    <section><h2>Weekly check-in</h2><div class="panel goal-panel">${goal?`<h3>${esc(goal.name)}</h3><p>${units.format(target)} hours per day</p><div>Potential saving · ${cash(potential)}/month</div>
    <div class="days">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,n)=>`<button aria-pressed="${state.checkedDays.includes(n)}" data-day="${n}">${d}</button>`).join('')}</div><button class="text-action" data-action="reset-week">Reset week</button>`:`<p>Choose a daily usage target for an appliance.</p><button class="text-action" data-action="calculator">Set a goal ${icon('arrowRight',16)}</button>`}</div></section></div>`;
}
function render() {
  const data = Energy.summary(state);
  const page = ({home:homePage,appliances:appliancesPage,analytics:analyticsPage,profile:profilePage,settings:settingsPage,about:TeamPage.render,savings:savingsPage,notifications:notificationsPage})[currentView];
  document.documentElement.dataset.theme=state.theme==='light'?'light':'dark';
  document.title = views[currentView]+' · Kuryentipid';
  app.innerHTML=header()+`<main id="main" class="view-${currentView}" tabindex="-1">${page(data)}</main>`;
}
app.addEventListener('click',event=>{
  const el=event.target.closest('button');
  if (!el) return;
  const d=el.dataset;
  if (d.go) navigate(d.go);
  if (d.detail) ApplianceUI.openDetail(d.detail);
  if (d.category) ApplianceUI.openCatalog(d.category);
  if (d.setting) ApplianceUI.openSetting(d.setting);
  if (d.switch) {
    const item=state.appliances.find(i=>i.id===d.switch);
    const next = !isOn(item);
    item.active = next;
    commit();
    const toggle = app.querySelector('[data-switch="'+CSS.escape(item.id)+'"]');
    toggle?.classList.add(next ? 'turned-on' : 'turned-off');
    toggle?.focus({preventScroll:true});
  }
  if (d.period && d.period!==period) {
    period=d.period;
    render();
    app.querySelector('.report-value')?.classList.add('value-change');
    app.querySelector('[data-period="'+period+'"]')?.focus({preventScroll:true});
  }
  if (d.day!==undefined) {
    const n=Number(d.day);
    state.checkedDays=state.checkedDays.includes(n)?state.checkedDays.filter(v=>v!==n):[...state.checkedDays,n];
    commit();
    app.querySelector('[data-day="'+n+'"]')?.focus({preventScroll:true});
  }
  if (d.action==='add') ApplianceUI.openEditor();
  if (d.action==='calculator') ApplianceUI.openCalculator();
  if (d.action==='tips') ApplianceUI.openTips();
  if (d.action==='edit-profile') editProfile();
  if (d.action==='alerts') {
    const config = BudgetAlerts.config(state);
    state.alerts = {...config,enabled:!config.enabled};
    commit();
    app.querySelector('[data-action="alerts"]')?.focus({preventScroll:true});
  }
  if (d.action==='device-alerts') void toggleDeviceAlerts();
  if (d.action==='read-alerts') {
    for (const entry of state.alertHistory) entry.read = true;
    commit('Alerts marked as read');
    app.querySelector('#recent-alerts')?.setAttribute('tabindex','-1');
    app.querySelector('#recent-alerts')?.focus({preventScroll:true});
  }
  if (d.action==='reset') ApplianceUI.openReset();
  if (d.action==='theme') {state.theme=state.theme==='light'?'dark':'light';commit();}
  if (d.action==='reset-week') {state.checkedDays=[];commit('Week reset.');}
});
async function toggleDeviceAlerts() {
  const config = BudgetAlerts.config(state);
  const wasOn = config.deviceEnabled && BudgetAlerts.support().permission==='granted';
  const permission = wasOn ? 'off' : await BudgetAlerts.requestPermission();
  state.alerts = {...BudgetAlerts.config(state),deviceEnabled:permission==='granted'};
  const message = permission==='granted' ? 'Device notifications enabled' : wasOn ? 'Device notifications off' : 'Notifications are available in the app';
  commit(message);
  app.querySelector('[data-action="device-alerts"]')?.focus({preventScroll:true});
}
app.addEventListener('submit',event=>{
  if (event.target.id!=='notice-limits-form') return;
  event.preventDefault();
  const fields=event.target.elements;
  state.budget=fields.budget.valueAsNumber;
  state.alerts={...BudgetAlerts.config(state),budgetPercent:fields.percent.valueAsNumber,energyLimit:fields.energy.valueAsNumber || 0};
  commit('Notification limits saved');
  app.querySelector('#notice-limits-form button')?.focus({preventScroll:true});
});
app.addEventListener('input',event=>{
  if (event.target.id!=='search') return;
  search=event.target.value;
  document.querySelector('#devices').innerHTML=filteredList();
});
document.addEventListener('trendchange',event=>{
  rankingUnit=event.detail.unit;
  const table=document.querySelector('#usage-ranking');
  if (table) table.innerHTML=rankedUsage();
});
document.querySelector('.skip').addEventListener('click',event=>{
  event.preventDefault();
  document.querySelector('main').focus();
});
window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
showView(location.hash.slice(1),false);
checkAlerts();
document.addEventListener('visibilitychange',()=>{if (!document.hidden) checkAlerts();});
window.addEventListener('storage',event=>{
  if (event.key!=='kuryentipid-state' && event.key!==null) return;
  Object.keys(state).forEach(key=>delete state[key]);
  Object.assign(state,Energy.load());
  checkAlerts();
  render();
});

