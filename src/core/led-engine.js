/**
 * RAZR LED Core Calculation Engine
 * Pure logic decoupled from UI and Frameworks.
 */

export const LEDEngine = {
  /**
   * Determine the required cabinets based on physical dimensions.
   */
  calculateQtyFromSize(widthM, heightM, cabWMm, cabHMm) {
    let wQty = widthM > 0 ? Math.round((widthM * 1000) / cabWMm) : 0;
    let hQty = heightM > 0 ? Math.round((heightM * 1000) / cabHMm) : 0;
    if (widthM > 0) wQty = Math.max(1, wQty);
    if (heightM > 0) hQty = Math.max(1, hQty);
    return { wQty, hQty };
  },

  /**
   * Calculate all technical specifications for a screen configuration.
   */
  calculateFullSpecs(wQty, hQty, modelData, groupConfig) {
    const totalQty = wQty * hQty;
    const screenWM = (wQty * groupConfig.w) / 1000;
    const screenHM = (hQty * groupConfig.h) / 1000;
    const area = screenWM * screenHM;
    const resW = wQty * modelData.rw;
    const resH = hQty * modelData.rh;
    const totalPixels = resW * resH;
    const weight = totalQty * groupConfig.weight;
    
    // Power consumption
    const powerAvg = Math.round(area * modelData.avg);
    const powerMax = Math.round(area * modelData.max);
    
    // Amperage (with 1.25x overcurrent safety)
    const amps = (area * modelData.max / 220 * 1.25);
    
    // Estimated elec cost (5 THB/unit)
    const elecCostPerHour = (area * modelData.max / 1000 * 5);

    return {
      totalQty,
      screenWM,
      screenHM,
      area,
      resW,
      resH,
      totalPixels,
      weight,
      powerAvg,
      powerMax,
      amps,
      elecCostPerHour
    };
  },

  /**
   * Filter and recommend the best controller.
   */
  recommendController(totalPixels, controllers, isOutdoor) {
    if (totalPixels <= 0) return null;
    
    let best = null;
    // Simple logic: find smallest controller that fits the load
    // If it's UOS (Outdoor), we might prefer specific controllers (e.g. not Playboxes)
    // but for now, we'll keep the logic generic or based on specific prefixes.
    
    for (const con of controllers) {
      if (con.load >= totalPixels) {
        if (!best || con.load < best.load) {
          best = con;
        }
      }
    }
    return best;
  }
};
