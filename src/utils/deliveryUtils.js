/**
 * Delivery Fee and Schedule Utility Functions
 */

export function checkDeliveryHoursActive(startTime = '07:30', endTime = '21:00') {
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (startTime || '07:30').split(':').map(Number);
    const [endH, endM] = (endTime || '21:00').split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes <= endTotal;
    } else {
      // Overnight delivery window (e.g. 20:00 to 02:00)
      return currentMinutes >= startTotal || currentMinutes <= endTotal;
    }
  } catch (e) {
    return true;
  }
}

export function calculateDeliveryFee({
  mode = 'delivery',
  distanceKm = 0.8,
  subtotal = 0,
  feeType = 'per_km',
  feePerKm = 2500,
  baseFare = 2000,
  flatFee = 2000,
  minOrderFree = 35000
} = {}) {
  if (mode !== 'delivery') return 0;

  // Free delivery threshold check
  if (minOrderFree > 0 && subtotal >= minOrderFree) {
    return 0;
  }

  if (feeType === 'per_km') {
    const km = Number(distanceKm) || 0.8;
    const rate = Number(feePerKm) || 2500;
    const base = Number(baseFare) || 2000;
    if (km <= 1) {
      return base;
    }
    return Math.round(base + (km - 1) * rate);
  }

  return Number(flatFee) || 2000;
}
