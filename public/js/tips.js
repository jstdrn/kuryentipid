// Guidance follows the appliance's function. A custom display icon is purely visual.
window.ApplianceTips = (() => {
  'use strict';
  const sources = {
    appliance: ['Meralco · Tips by appliance', 'https://www.meralco.com.ph/residential/save-money-and-energy/tips-and-how-tos/tips-by-appliance'],
    bright: ['Meralco · Bright Ideas', 'https://www.meralco.com.ph/residential/bright-ideas'],
    cooling: ['U.S. DOE · Home cooling', 'https://www.energy.gov/energysaver/articles/energy-saver-101-home-cooling-infographic'],
    comfort: ['U.S. DOE · Energy Saver guide', 'https://www.energy.gov/sites/default/files/2022-08/energy-saver-guide-2022.pdf'],
    shade: ['U.S. DOE · Energy-saving tips for renters', 'https://www.energy.gov/articles/5-tips-energy-saving-renters'],
    fridge: ['ENERGY STAR · Refrigerators', 'https://www.energystar.gov/products/refrigerators'],
    wash: ['ENERGY STAR · Clothes washers', 'https://www.energystar.gov/products/clothes_washers?qt-consumers_product_tab=2'],
    tv: ['ENERGY STAR · Televisions', 'https://www.energystar.gov/products/televisions'],
    monitor: ['ENERGY STAR · Monitors', 'https://www.energystar.gov/products/monitors'],
    computer: ['ENERGY STAR · Computers', 'https://www.energystar.gov/products/computers'],
    print: ['ENERGY STAR · Imaging equipment', 'https://www.energystar.gov/products/imaging_equipment'],
    induction: ['ENERGY STAR · Electric cooking', 'https://www.energystar.gov/products/electric_cooking_products'],
    rice: ['Zojirushi · Using a rice cooker', 'https://store.zojirushi.com/blogs/rice-cookers/here-s-what-you-should-know-usage'],
    measureRice: ['Panasonic Philippines · Rice cooker instructions', 'https://www.panasonic.com/content/dam/Panasonic/ph/en/PDF/productPDF/2024/Operating-Instructions-SR-DM184KSC.pdf'],
    microwave: ['National Energy Action · Appliance monitoring study', 'https://www.nea.org.uk/wp-content/uploads/2025/05/Appliance-monitoring-full-report-v2-2.pdf'],
    kitchen: ['Energy Saving Trust · Kitchen tips', 'https://energysavingtrust.org.uk/your-top-five-tips-to-save-energy-in-the-kitchen/'],
    portion: ['Energy Saving Trust · Comparing cooking methods', 'https://energysavingtrust.org.uk/air-fryer-oven-microwave-hob-slow-cooker-cheaper-cooking/'],
    summer: ['U.S. DOE · Summer energy tips', 'https://www.energy.gov/articles/top-11-things-you-didnt-know-about-saving-energy-home-summer-edition'],
    blender: ['Philips · Blender instructions', 'https://www.documents.philips.com/assets/20210512/a93e35b7a3ce4eb593e1ad2600c4deb7.pdf'],
    airfryer: ['Philips · Air fryer care', 'https://www.philips.co.uk/c-f/XC000012903/how-to-clean-my-philips-airfryer'],
    lighting: ['U.S. DOE · Choosing efficient bulbs', 'https://www.energy.gov/cmei/femp/purchasing-energy-efficient-light-bulbs'],
    controls: ['U.S. DOE · Lighting controls', 'https://integratedlightingcampaign.energy.gov/sites/default/files/2024-10/LED%20and%20Controls%20Guidance%20for%20GSA_0.pdf'],
    deco: ['TP-Link · Deco Eco Mode and Wi-Fi schedules', 'https://community.tp-link.com/en/home/forum/topic/598600'],
  };
  const steps = {
    AC: [
      ['Choose a comfortable setpoint', 'Start with the warmest cooling setting that keeps everyone comfortable. If the room stays empty, use the timer or raise the setpoint for that period.', 'comfort'],
      ['Inspect the filter', 'With the unit off, check the accessible filter for dust. Follow your model’s instructions for washing a reusable filter or replacing a disposable one.', 'cooling'],
      ['Shade the room before it heats up', 'Close blinds or curtains on windows receiving direct sun during the hottest part of the day.', 'shade'],
      ['Leave space around the outdoor unit', 'Keep stored items and vegetation clear of the air intake and outlet. Use the clearances in the installation manual.', 'bright'],
    ],
    RF: [
      ['Check the door seal', 'Look for a gasket that is torn or leaves a gap when the door closes. Move packages out of the way and repair a damaged seal.', 'fridge'],
      ['Give heat a way out', 'Keep the refrigerator away from the stove and direct sun where possible. Leave the ventilation space specified for the model.', 'fridge'],
    ],
    WM: [
      ['Combine compatible loads', 'Wait until you have enough similar laundry for a full cycle within the machine’s capacity.', 'wash'],
      ['Check the care label before heating water', 'Choose a cold cycle for loads that wash well in cold water. Use a warmer setting when the garment instructions or soil level call for it.', 'wash'],
    ],
    FN: [
      ['Aim airflow where people sit', 'Choose the lowest speed that feels comfortable. Switch the fan off when the room is empty.', 'appliance'],
      ['Clear dust from the grille', 'Unplug the fan and clean accessible blades and the guard as the manual directs so air can pass through.', 'appliance'],
    ],
    TV: [
      ['Check the picture preset', 'Look for an energy-saving picture mode and adjust brightness for the room.', 'tv'],
      ['Use the built-in streaming app when available', 'If the same show is on the TV’s own app, you can turn off the separate game console or streaming device.', 'tv'],
    ],
    RC: [
      ['Choose the batch you will serve', 'Measure the rice and water before you start. Use the cooker’s markings for the selected grain and portion.', 'measureRice'],
      ['Plan when to finish cooking', 'Time the batch for the meal to shorten keep-warm time. Once all the rice is served or stored, cancel keep-warm.', 'rice'],
    ],
    KT: [
      ['Measure the water first', 'For a drink, use your cup to measure what you need. Stay between the kettle’s minimum and maximum fill marks.', 'kitchen'],
      ['Count boiling time', 'For a better estimate, time a normal boil and multiply by your daily number of boils. Convert the total minutes to hours.', 'appliance'],
    ],
    TO: [
      ['Use the toaster for a small portion', 'When bread is all you need to brown, use the toaster instead of heating a full oven.', 'summer'],
      ['Measure one cycle', 'Record how long your usual browning setting takes. Multiply by the cycles you actually run each day when setting the schedule.', 'appliance'],
    ],
    IH: [
      ['Check the pan base', 'Use a flat pan marked for induction. A magnet that sticks firmly to the base is a useful compatibility check.', 'induction'],
      ['Keep heat in the pan', 'Match the pan to the cooking zone and cover it when the recipe permits.', 'bright'],
    ],
    AF: [
      ['Match the appliance to the portion', 'An air fryer suits a small batch. If a meal requires several batches, compare the total cooking time with using the oven once.', 'portion'],
      ['Clean the cooking basket', 'Once the basket and pan have cooled, clean removable parts as the model’s manual directs. Use a soft sponge on nonstick surfaces.', 'airfryer'],
    ],
    MW: [
      ['Reheat just the portion you need', 'For a serving of leftovers, use the microwave instead of preheating a full oven.', 'kitchen'],
      ['Use the electrical input rating', 'When entering wattage, check the rating plate for electrical input. The cooking-output figure measures power delivered to the food.', 'microwave'],
    ],
    BL: [
      ['Use the right batch size', 'Check the jar’s fill line and the manual’s limits for the ingredients you are using. Split a batch that exceeds those limits.', 'blender'],
      ['Use pulse for short bursts', 'If your blender has a pulse setting, use brief bursts for rough chopping and check the texture between bursts.', 'blender'],
    ],
    IR: [
      ['Sort before switching on', 'Group garments by their care-label settings. Start with items that take a cooler iron and work up to hotter settings.', 'bright'],
      ['Finish the batch in one session', 'Set the ironing board and clothes out first. Switch the iron off as soon as the batch is finished.', 'bright'],
    ],
    VC: [
      ['Check airflow if pickup drops', 'Inspect the dust container and accessible filters. Empty the bin or replace the bag as the manual directs.', 'bright'],
      ['Match the tool to the floor', 'Select the attachment and power setting for the surface to reduce repeat passes over the same patch.', 'bright'],
    ],
    LT: [
      ['Compare light output', 'When replacing a bulb, match the lumens you need first, then compare watts. Two bulbs with the same wattage can produce different amounts of light.', 'lighting'],
      ['Set a timer for predictable use', 'For a light that regularly gets left on, choose a compatible timer or occupancy control and set its delay around how the space is used.', 'controls'],
    ],
    NW: [
      ['Check which devices need Wi-Fi overnight', 'On a router that supports radio scheduling, choose a quiet period only if all wireless clients can disconnect. Check cameras and other connected equipment first.', 'deco'],
      ['Match the estimate to actual uptime', 'For equipment left powered around the clock, enter 24 hours. Use a model-specific operating-power figure when available.', 'appliance'],
    ],
    MN: [
      ['Set a display sleep timeout', 'In the connected computer’s power settings, choose how long an idle display stays on.', 'monitor'],
      ['Let the screen go to sleep', 'A moving screen saver keeps the display active. Select display sleep for periods away from the desk.', 'computer'],
    ],
    PR: [
      ['Keep automatic sleep enabled', 'Check the printer’s power menu for a sleep timer. Choose an idle delay that suits the gap between your print jobs.', 'print'],
      ['Use duplex for drafts', 'When both sides are suitable and the printer supports it, select two-sided printing in the print dialog.', 'print'],
    ],
    OT: [
      ['Use the rating for your model', 'Check the label or manufacturer’s specifications for input watts. If the appliance has several power settings, use the one you normally run.', 'appliance'],
      ['Time a typical session', 'Track one normal use and how often you repeat it. Enter that schedule to compare the estimated cost at your saved rate.', 'appliance'],
    ],
  };
  return Object.freeze({ sources, steps });
})();
