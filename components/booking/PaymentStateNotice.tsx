import type { Booking } from "@/types/booking";

export default function PaymentStateNotice({ booking }: { booking: Booking }) {
  if (booking.status !== "PENDING" || booking.paymentCreationStatus === "CREATED") return null;
  const message = booking.paymentCreationStatus === "CREATING"
    ? "Payment setup is still processing. Please check this booking again shortly."
    : "Payment setup has not completed for this booking.";
  return <p className="mt-5 border-l-2 border-ochre pl-4 text-sm leading-relaxed text-ink/75">{message}</p>;
}
