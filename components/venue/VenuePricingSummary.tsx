import { formatDuration, formatEur } from "@/lib/format";

type Props = {
  hourlyRateEur: number;
  minimumBookingMinutes: number;
  fullDayRateEur: number | null;
  compact?: boolean;
};

export default function VenuePricingSummary({ hourlyRateEur, minimumBookingMinutes, fullDayRateEur, compact = false }: Props) {
  return <div className={compact ? "text-right" : "space-y-1"}>
    <div className="tabular font-mono text-lg text-ink">{formatEur(hourlyRateEur)}/hour</div>
    <div className="text-xs text-taupe">Minimum {formatDuration(minimumBookingMinutes)}</div>
    {fullDayRateEur !== null && <div className="text-xs text-taupe">Full day {formatEur(fullDayRateEur)}</div>}
  </div>;
}
