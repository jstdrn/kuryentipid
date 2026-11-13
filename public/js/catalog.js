/* Model ratings only. A user's operating schedule is separate from these specifications. */
window.ApplianceCatalog = (() => {
  'use strict';
  const panasonicAC = 'https://www.panasonic.com/content/dam/pim/ph/en/RA/RAC-CS/RAC-CS-PU-WKQ-XKQ-SPP/Panasonic%20Philippines%20RAC%20Leaflet%202022-2023.pdf';
  const fan = 'https://www.panasonic.com/ph/consumer/air-solution/fan/stand/';
  const philips = 'https://www.philips.com.ph/c-p/';
  const sharp = 'https://ph.sharp/products/home-appliances/';
  const lighting = 'https://www.lighting.philips.com.ph/consumer/p/';
  const brother = 'https://www.brother.com.ph/en/printers/all-printers/';

  const categories = {
    AC: 'Air conditioner', RF: 'Refrigerator', FN: 'Electric fan', RC: 'Rice cooker',
    WM: 'Washing machine', TV: 'Television', KT: 'Kettle', TO: 'Toaster',
    AF: 'Air fryer', MW: 'Microwave', IH: 'Induction hob', BL: 'Blender',
    IR: 'Iron', VC: 'Vacuum cleaner', LT: 'Lighting', NW: 'Networking',
    MN: 'Monitor', PR: 'Printer',
  };

  function model(id, icon, brand, modelNumber, name, watts, ratingType, source, labelData) {
    return Object.freeze({
      id, icon, category: categories[icon], brand, model: modelNumber, name,
      watts, ratingType, source, sourceLabel: labelData ? 'DOE energy label' : 'Manufacturer specs',
      ...labelData,
    });
  }

  return Object.freeze([
    model('pana-pu9wkq', 'AC', 'Panasonic', 'CS/CU-PU9WKQ', 'Inverter split air conditioner',
      670, 'Rated cooling input (220–885 W range)', panasonicAC),
    model('pana-pu12wkq', 'AC', 'Panasonic', 'CS/CU-PU12WKQ', 'Inverter split air conditioner',
      750, 'Rated cooling input (245–1,170 W range)', panasonicAC),
    model('pana-pu18wkq', 'AC', 'Panasonic', 'CS/CU-PU18WKQ', 'Inverter split air conditioner',
      1550, 'Rated cooling input (290–1,800 W range)', panasonicAC),
    model('pana-pu24xkq', 'AC', 'Panasonic', 'CS/CU-PU24XKQ', 'Inverter split air conditioner',
      1650, 'Rated cooling input (250–2,050 W range)', panasonicAC),
    model('fuji-ibm12ss2', 'RF', 'Fujidenzo', 'IBM-12SS2', '323 L bottom-mount refrigerator',
      null, 'Monthly label consumption', 'https://prod-cms.doe.gov.ph/documents/d/eumb/attachment-b-ref-el-as-of-december-31-2025-pdf', { monthlyKwh: 28.50 }),
    model('pana-nrbw530j', 'RF', 'Panasonic', 'NR-BW530J', '500 L refrigerator-freezer',
      null, 'Monthly label consumption', 'https://legacy.doe.gov.ph/sites/default/files/pdf/pelp/2Q-RefrigeratingAppliances.pdf', { monthlyKwh: 32.4 }),
    model('pana-f405ss', 'FN', 'Panasonic', 'F-405SS', '16-inch stand fan',
      62, 'Maximum input', fan + 'f-405ss.html'),
    model('pana-f405sb', 'FN', 'Panasonic', 'F-405SB', '16-inch stand fan',
      60, 'Maximum input', fan + 'f-405sb.html'),
    model('philips-hd4515', 'RC', 'Philips', 'HD4515/66', 'Daily Collection rice cooker',
      860, 'Rated power', 'https://www.documents.philips.com/assets/20211219/b016f09741cd4e33bc13ae03007dce69.pdf'),
    model('sharp-estl7010p', 'WM', 'Sharp', 'ES-TL7010P-GY', '7 kg top-load washer',
      376, 'Specified power consumption', sharp + 'es-tl7010p-gy'),
    model('sharp-esjn08a9', 'WM', 'Sharp', 'ES-JN08A9(GY)', '8 kg top-load washer',
      310, 'Specified power consumption', sharp + 'es-jn08a9gy'),
    model('samsung-u8000f', 'TV', 'Samsung', 'UA43U8000FGXXP', '43-inch Crystal UHD TV',
      115, 'Maximum power consumption', 'https://www.samsung.com/ph/business/tvs/uhd-4k-tv/u8000f-43-inch-crystal-uhd-4k-smart-tv-ua43u8000fgxxp/'),
    model('samsung-n5003', 'TV', 'Samsung', 'UA43N5003ARXXP', '43-inch Full HD TV',
      70, 'Maximum power consumption', 'https://www.samsung.com/ph/business/tvs/full-hd-tv/n5003-43-inch-full-hd-tv-ua43n5003arxxp/'),
    model('philips-hd9306', 'KT', 'Philips', 'HD9306/03', '1.5 L stainless steel kettle',
      1800, 'Rated power', philips + 'HD9306_03/daily-collection-kettle'),
    model('philips-hd4608', 'KT', 'Philips', 'HD4608/00', '0.8 L mini kettle',
      2400, 'Rated power', philips + 'HD4608_00/daily-collection-mini-kettle'),
    model('philips-hd2618', 'TO', 'Philips', 'HD2618/00', 'Aluminium Collection toaster',
      1200, 'Rated power', philips + 'HD2618_00/aluminium-collection-toaster'),
    model('philips-hd9200', 'AF', 'Philips', 'HD9200/91', '4.1 L air fryer',
      1400, 'Rated power', 'https://www.documents.philips.com/assets/20220614/fb19924db370453186e9aeb400ae170b.pdf'),
    model('samsung-ms23k3513', 'MW', 'Samsung', 'MS23K3513AW/TC', '23 L solo microwave',
      1200, 'Microwave-mode electrical input', 'https://www.samsung.com/ph/business/microwave-ovens/solo/microwave-solo-ms23k3513aw-tc/'),
    model('philips-hd4932', 'IH', 'Philips', 'HD4932/00', 'Viva Collection induction cooker',
      2100, 'Full-power cooking setting', philips + 'HD4932_00/viva-collection-premium-induction-cooker'),
    model('philips-hr2051', 'BL', 'Philips', 'HR2051/00', 'Daily Collection blender',
      450, 'Rated power', philips + 'HR2051_00/daily-collection-blender'),
    model('philips-gc2820', 'IR', 'Philips', 'GC2820/02', 'Steam iron',
      2000, 'Rated heating power', philips + 'GC2820_02/steam-iron'),
    model('philips-fc8085', 'VC', 'Philips', 'FC8085/01', 'Bagless vacuum cleaner',
      1200, 'IEC input power', 'https://dev.philips.com.ph/c-p/FC8085_01/bagless-vacuum-cleaner/overview'),
    model('philips-a60', 'LT', 'Philips', '929004342807', 'A60 E27 warm white LED bulb',
      8, 'Lamp power', lighting + 'led-bulb-8w-a60-e27/8721103131874'),
    model('philips-smart-rgb', 'LT', 'Philips', '929003601013', 'Smart RGB A60 E27 LED bulb',
      8.5, 'Lamp power', lighting + 'smart-led-bulb-85w-eq.60w-a60-e27/8720169170971'),
    model('tplink-c6', 'NW', 'TP-Link', 'Archer C6', 'Dual-band Wi-Fi router',
      3.56, 'Measured idle power (US test)', 'https://www.tp-link.com/us/landing/tp-link-sne-energy-information-2023/'),
    model('tplink-deco-x20', 'NW', 'TP-Link', 'Deco X20 EU V3.0/V3.20', 'AX1800 mesh Wi-Fi node',
      11.67, 'Maximum consumption per node, including adapter', 'https://static.tp-link.com/upload/product-overview/2024/202402/20240204/Deco%20X20%28EU%293.0%263.20_Datasheet.pdf'),
    model('tplink-sg105', 'NW', 'TP-Link', 'TL-SG105 UN V9', '5-port gigabit Ethernet switch',
      3, 'Maximum consumption at 220 V / 50 Hz', 'https://static.tp-link.com/upload/product-overview/2026/202602/20260203/TL-SG105%28UN%299.0_Datasheet.pdf'),
    model('dell-e2423h', 'MN', 'Dell', 'E2423H', '24-inch desktop monitor',
      16, 'On-mode consumption', 'https://www.dell.com/en-my/shop/dell-24-monitor-e2423h/apd/210-bezu/monitors-monitor-accessories'),
    model('brother-hll5210dw', 'PR', 'Brother', 'HL-L5210DW', 'Monochrome laser printer',
      670, 'Approximate consumption while printing', brother + 'hl-l5210dw'),
    model('brother-mfcl5915dw', 'PR', 'Brother', 'MFC-L5915DW', 'Multifunction laser printer',
      710, 'Approximate consumption while printing', brother + 'mfc-l5915dw'),
  ]);
})();
