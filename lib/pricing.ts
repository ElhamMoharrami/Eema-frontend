export type PricingPreview = {
  durationMinutes: number;
  billableMinutes: number;
  hourlyTotal: number;
  estimatedPrice: number;
  minimumApplies: boolean;
  fullDayRateApplies: boolean;
};

export function calculatePricingPreview(startTime: string, endTime: string, hourlyRateEur: number, minimumBookingMinutes: number, fullDayRateEur: number | null): PricingPreview | null {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) return null;
  if (!Number.isFinite(hourlyRateEur) || hourlyRateEur < 0.01 || hourlyRateEur > 99999999.99
    || !Number.isInteger(minimumBookingMinutes) || minimumBookingMinutes < 1 || minimumBookingMinutes > 10080
    || (fullDayRateEur !== null && (!Number.isFinite(fullDayRateEur) || fullDayRateEur < 0.01 || fullDayRateEur > 99999999.99))) return null;
  const durationMinutes = end - start;
  const billableMinutes = Math.max(durationMinutes, minimumBookingMinutes);
  // Venue prices are persisted in cents. These integer products stay below
  // Number.MAX_SAFE_INTEGER at the API's rate and billing-minute bounds.
  const rateCents = Math.round(hourlyRateEur * 100);
  const hourlyCents = Math.floor((rateCents * billableMinutes + 30) / 60);
  const capCents = fullDayRateEur === null ? null : Math.round(fullDayRateEur * 100);
  const fullDayRateApplies = capCents !== null && hourlyCents > capCents;
  const priceCents = fullDayRateApplies ? capCents! : hourlyCents;
  if (priceCents > 9999999999) return null;
  const hourlyTotal = hourlyCents / 100;
  return {
    durationMinutes,
    billableMinutes,
    hourlyTotal,
    estimatedPrice: priceCents / 100,
    minimumApplies: durationMinutes < minimumBookingMinutes,
    fullDayRateApplies,
  };
}

function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
