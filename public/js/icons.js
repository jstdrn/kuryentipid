/* Shared 24-unit line icons. Controls and their accessible names live in the UI. */
window.icon = (() => {
  const shapes = {
    home: '<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
    dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    appliances: '<rect x="3" y="4" width="10" height="16" rx="2"/><path d="M3.5 10H13M6 6.8v.8M6 12.5v2"/><rect x="16" y="8" width="5" height="12" rx="1.5"/><path d="M17.5 11h2"/>',
    settings: '<path d="m10 3-.5 2.2-1.8 1-2.1-.7-2 3.4 1.7 1.6v2.1l-1.7 1.6 2 3.5 2.1-.7 1.8 1 .5 2.2h4l.5-2.2 1.8-1 2.1.7 2-3.5-1.7-1.6v-2.1l1.7-1.6-2-3.4-2.1.7-1.8-1L14 3Z"/><circle cx="12" cy="11.6" r="3"/>',
    chart: '<path d="M4 3.5v16h16.5M8 15v-3.5m4 3.5V8m4 7V5.5"/>',
    goal: '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4.2"/><path d="m11 13 8.3-8.3m-.1-2 .1 2 2 .1"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.3"/><path d="M7.5 3v4m9-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowRight: '<path d="M4.5 12h15m-6-6 6 6-6 6"/>',
    chevronRight: '<path d="m9 5.5 6.5 6.5L9 18.5"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="M19.5 12h-15m6-6-6 6 6 6"/>',
    edit: '<path d="m4.5 15.5 12-12a1.9 1.9 0 0 1 2.7 0l1.3 1.3a1.9 1.9 0 0 1 0 2.7l-12 12-5 1ZM14.7 5.5l3.8 3.8"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.7"/><path d="m15.5 15.5 5 5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.8 8.8 0 1 0 10.9 10.9Z"/>',
    bell: '<path d="M9.5 18.5a2.5 2.5 0 0 0 5 0M4 16c1.7-2 2.2-3.3 2.2-6.4a5.8 5.8 0 1 1 11.6 0c0 3.1.5 4.4 2.2 6.4Z"/>',
    bolt: '<path d="m13.3 2.7-8.8 11h6.9l-.7 7.6 8.8-11h-6.9Z"/>',
    bill: '<path d="M5.5 3.5 8 5l2-1.5 2 1.5 2-1.5L16 5l2.5-1.5v17L16 19l-2 1.5-2-1.5-2 1.5L8 19l-2.5 1.5Z"/><path d="M9 9h6m-6 4h4"/>',
    wallet: '<path d="M20 8V6a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h13.5v9H6a3 3 0 0 1-3-3V7"/><path d="M20 12.5h-3a1.8 1.8 0 0 0 0 3.5h3Z"/>',
    leaf: '<path d="M20 3.5C14.5 5 9 4.5 5.7 8.6c-2.8 3.4-1 8.8 3.3 10 6.3 1.6 10.7-4.2 11-15.1Z"/><path d="M3.5 21c3.5-5 6.8-8.5 11.3-11.4"/>',
    check: '<path d="m4.5 12 5 5 10-10"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8.2v.3"/>',
    plug: '<path d="M8 3v5m8-5v5M6 8h12v3.2a6 6 0 0 1-12 0ZM12 17.5V21"/>',
    wind: '<path d="M3 8h10a3 3 0 1 0-3-3m-7 7h15a3 3 0 1 0-2.6-4.5M5 16h8a2.8 2.8 0 1 1-2.8 2.8"/>',
    thermometer: '<path d="M10 13.2V5a2 2 0 1 1 4 0v8.2a4.2 4.2 0 1 1-4 0Z"/><path d="M12 9v7.1"/><circle cx="12" cy="17" r="1"/>',
    cycle: '<path d="M4 10a8.3 8.3 0 0 1 14-4.4L20 8M20 3v5h-5m5 6a8.3 8.3 0 0 1-14 4.4L4 16m0 5v-5h5"/>',
    power: '<path d="M12 2.5V11M7.5 5.5a8.3 8.3 0 1 0 9 0"/>',
    user: '<circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    activity: '<path d="M2.5 12H7l3.1-8 3.8 16 3-8h4.6"/>',
    minus: '<path d="M5 12h14"/>',
    AC: '<rect x="2.5" y="5" width="19" height="10.5" rx="2.2"/><path d="M5.5 12h13m-2-3.5h1.5M7.5 18c0 1.2-.6 2-1.2 2.4m5.7-2.4v2.5m4.5-2.5c0 1.2.6 2 1.2 2.4"/>',
    RF: '<rect x="6" y="2.5" width="12" height="18.5" rx="2.2"/><path d="M6 9.5h12M8.8 5.8v1.4m0 5.3v3.2M8 21v1m8-1v1"/>',
    RC: '<path d="M3.5 10.5h17v3a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7Zm0 0c.5-3.5 3.7-5.5 8.5-5.5s8 2 8.5 5.5M9.5 5V3.5h5V5M6 17l-1.5 3M18 17l1.5 3"/><path d="M10 14.5h4"/>',
    WM: '<rect x="4.5" y="2.5" width="15" height="19" rx="2"/><path d="M4.5 8h15m-11.5-2.7h3m4.8 0h.3"/><circle cx="12" cy="14.5" r="4.3"/><path d="M8 14.6c2-1.2 3-1.1 4 .1 1.1 1.3 2.6 1.1 4-.3"/>',
    TV: '<rect x="2.5" y="4.5" width="19" height="13" rx="2"/><path d="M12 17.5V20m-4 0h8"/>',
    FN: '<circle cx="12" cy="10" r="7.5"/><circle cx="12" cy="10" r="1"/><path d="M12 8.8c-3.1-1.3-3.2-3.8-.6-3.8 1.8 0 2.8 1.8 1.5 3.5m.2 1.7c2.7-1.8 4.8-.3 3.2 1.8-1 1.4-3 .9-3.7-.7m-1.3-.2c.3 3.3-1.9 4.5-3 2.2-.8-1.6.5-3.1 2.3-3M12 17.5v3m-4 1h8"/>',
    KT: '<path d="M8 7V5.7A1.7 1.7 0 0 1 9.7 4h4.6A1.7 1.7 0 0 1 16 5.7V7m-8 0h9l1.2 9.8c.2 1.7-.8 3-2.5 3H7.4c-1.6 0-2.7-1.1-2.5-2.6l.8-6.1L3 7.7l4.5 1.1Zm9.6 1.5h1.5c1.5 0 2.1 1 2.1 2.3v1.6c0 1.5-.6 2.6-2.6 2.6h-.5M7 22h9.8"/>',
    TO: '<path d="M4 11.5c0-1.5 1.3-2.7 2.8-2.7h9.4c1.8 0 3.3 1.4 3.3 3.2v6.6c0 .9-.7 1.6-1.6 1.6H5.6c-.9 0-1.6-.7-1.6-1.6Zm3.6-2.7V7.2c-1.5-.3-1.6-2.8.1-3.3 2.3-.7 5.9-.7 8.2 0 1.7.5 1.6 3 .1 3.3v1.6M19.6 14h2m-5.5-1.8v3.6M7 20.4v.9m9.5-.9v.9"/><circle cx="7.6" cy="16.3" r=".75"/>',
    IH: '<rect x="2.6" y="4.4" width="18.8" height="15.2" rx="2.4"/><circle cx="9.1" cy="11" r="4.1"/><circle cx="16.9" cy="10" r="2.5"/><path d="M15.1 16.3h.5m2.5 0h.5"/>',
    AF: '<path d="M6.3 4.2c3.3-1.1 8-1.1 11.4 0 1.2.4 1.9 1.6 2 3l.8 10.2c.1 2.1-1.4 3.6-3.5 3.6H7c-2.1 0-3.6-1.5-3.5-3.6l.8-10.2c.1-1.4.8-2.6 2-3ZM4.2 11.5h15.6"/><rect x="10.3" y="12" width="3.4" height="5.3" rx="1.2"/><path d="M10 7.3h4"/>',
    BL: '<path d="M7 4.6h9.5l-1.7 10.6H9ZM6 3.1h10.6m-.4 3h2.4c1 0 1.5.7 1.3 1.7l-.4 2.4c-.2 1.1-1 1.6-2.2 1.6h-1.5M8.6 15.2h6.4l2.5 4.4c.5 1 0 1.7-1 1.7H7.1c-1 0-1.4-.7-.9-1.7Z"/><circle cx="11.8" cy="18.5" r=".6"/>',
    IR: '<path d="M3 17.5c1.3-3.3 5.3-6 9.8-6.8l5.6-.7-1-2.5H9.8c-1.1 0-1.8-.4-1.8-1.4s.7-1.6 1.8-1.6h7.6c1.1 0 1.9.7 2.2 1.8l2 10.9H3Zm.1 2.3h18.3M13.6 13.6h2.6"/>',
    LT: '<path d="M8.6 16.8c-.2-1.7-.7-2.4-2-4a6.6 6.6 0 1 1 10.8 0c-1.3 1.6-1.8 2.3-2 4Zm1 2.6h4.8m-3.8 2.2h2.8M9.7 10.6 12 13l2.3-2.4M12 13v3.6"/>',
    NW: '<rect x="2.7" y="13.4" width="18.6" height="6.6" rx="2"/><path d="M6.1 13.1V5m11.8 8.1V5M7 16.8h.2m2.8 0h.2m4.1 0h3.2M9.3 7.9a4.2 4.2 0 0 1 5.4 0m-3.7 2a1.8 1.8 0 0 1 2 0"/>',
    PR: '<path d="M6.8 8.5V3.7h10.4v4.8M6 17.5H4.7c-1.1 0-1.8-.8-1.8-1.9v-5c0-1.3.9-2.2 2.2-2.2h13.8c1.3 0 2.2.9 2.2 2.2v5c0 1.1-.7 1.9-1.8 1.9H18"/><path d="M6.6 14.1h10.8v6.6H6.6Zm2.7 3.1h5.4m2.7-5.9h.3"/>',
    MN: '<rect x="2.7" y="3.8" width="18.6" height="13.6" rx="1.9"/><path d="M3.2 14.4h17.6m-10.5 3-.7 3.4m4.2-3.4.7 3.4m-7.2.3h9.3"/>',
    MW: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><rect x="5" y="7.9" width="10.4" height="8.1" rx="1"/><path d="M18.1 8.2h.2m-.2 3.5h.2m-.3 3.8h.4M5.5 19v1.4m13-1.4v1.4"/>',
    VC: '<path d="M3.6 17.9c.4-2.2 2.9-4 6.1-4.1 2.1-.1 3.5.9 4.9 2.8l1.7 2.7H8.4m-4.6 0h-.5m8.5-5.2 2.5-9.3c.3-1.3 1.8-1.8 2.8-1l1.5 1.4m-4.2 4.3 4.9 8.3m-1.9 1.7 3.8-2.2"/><circle cx="6" cy="18.8" r="2.4"/>',
    upload: '<path d="M12 15V3m-4 4 4-4 4 4M4 14.5v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    image: '<rect x="3" y="3.5" width="18" height="17" rx="2.3"/><circle cx="8.6" cy="8.8" r="1.5"/><path d="m4 18.5 5.5-5.7 3.1 2.9 3.6-4.4 4.5 5.1"/>',
  };
  shapes.OT = shapes.plug;

  return (name, size = 20) => {
    const pixels = Number(size);
    const side = Number.isFinite(pixels) && pixels > 0 ? Math.min(pixels, 256) : 20;
    const content = Object.hasOwn(shapes, name) ? shapes[name] : shapes.plug;
    return `<svg aria-hidden="true" focusable="false" width="${side}" height="${side}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
  };
})();

// The appliance type drives estimates; a different display icon changes only its picture.
window.applianceIconChoices = Object.freeze([
  ['AC', 'Air conditioner'], ['RF', 'Refrigerator'], ['RC', 'Rice cooker'],
  ['WM', 'Washing machine'], ['TV', 'Television'], ['FN', 'Fan'],
  ['KT', 'Kettle'], ['TO', 'Toaster'], ['IH', 'Induction hob'], ['AF', 'Air fryer'],
  ['BL', 'Blender'], ['IR', 'Iron'], ['LT', 'Light'], ['NW', 'Wi-Fi router'],
  ['PR', 'Printer'], ['MN', 'Monitor'], ['MW', 'Microwave'], ['VC', 'Vacuum'],
  ['OT', 'Other appliance'],
].map(([code, label]) => Object.freeze({ code, label })));

window.applianceIcon = (() => {
  const allowedCodes = new Set(window.applianceIconChoices.map(option => option.code));
  return function applianceIcon(item, size = 22) {
    const value = Number(size);
    const side = Number.isFinite(value) && value > 0 ? Math.min(value, 256) : 22;
    if (LocalPhoto.isSavedPng(item?.customIcon, 80 * 1024)) {
      return `<img class="personal-appliance-icon" src="${item.customIcon}" width="${side}" height="${side}" alt="" aria-hidden="true" draggable="false" style="display:block;object-fit:contain;border-radius:4px">`;
    }
    const code = allowedCodes.has(item?.displayIcon) ? item.displayIcon : item?.icon;
    return window.icon(allowedCodes.has(code) ? code : 'OT', side);
  };
})();
window.deviceIcon = window.applianceIcon;
