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
  const durationMinutes = end - start;
  const billableMinutes = Math.max(durationMinutes, minimumBookingMinutes);
  const hourlyTotal = hourlyRateEur * billableMinutes / 60;
  const fullDayRateApplies = fullDayRateEur !== null && hourlyTotal > fullDayRateEur;
  return {
    durationMinutes,
    billableMinutes,
    hourlyTotal,
    estimatedPrice: fullDayRateApplies ? fullDayRateEur : hourlyTotal,
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
