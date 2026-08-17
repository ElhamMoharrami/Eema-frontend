import { BOOKING_STATUS_LABELS, VENUE_STATUS_LABELS } from "@/lib/status";
import type { BookingStatus } from "@/types/booking";
import type { VenueStatus } from "@/types/venue";

type Props = { kind: "booking"; status: BookingStatus } | { kind: "venue"; status: VenueStatus };

export default function StatusBadge(props: Props) {
  const label = props.kind === "booking" ? BOOKING_STATUS_LABELS[props.status] : VENUE_STATUS_LABELS[props.status];
  return <span className="available-mark">{label}</span>;
}
