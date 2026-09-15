/** Calendar date formatting only; Spring owns availability and interval selection. */
export type CalendarMonth = { year: number; month: number };

export function todayInZone(timezone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function monthStart(month: CalendarMonth) { return isoDate(month.year, month.month, 1); }
export function monthEnd(month: CalendarMonth) { return isoDate(month.year, month.month, new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate()); }
export function offsetMonth(month: CalendarMonth, offset: number): CalendarMonth {
  const value = new Date(Date.UTC(month.year, month.month + offset, 1));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() };
}
