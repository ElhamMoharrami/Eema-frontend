'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { VenueDto } from '@/lib/api-types';
import { venueApi, bookingApi, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { formatEur } from '@/lib/utils';

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [venue, setVenue] = useState<VenueDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Checkout modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [shootDate, setShootDate] = useState('');
  const [contactName, setContactName] = useState(user?.fullName ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactPhone, setContactPhone] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    venueApi.get(id)
      .then(setVenue)
      .catch(err => {
        if (err instanceof ApiError && err.isNotFound) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Pre-fill contact from auth user
  useEffect(() => {
    if (user) {
      setContactName(user.fullName ?? '');
      setContactEmail(user.email);
    }
  }, [user]);

  const handleReserveClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/venue/${id}`);
      return;
    }
    setModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!venue || !shootDate || !contactName || !contactEmail) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await bookingApi.checkout({
        venueId: venue.id,
        shootDate,
        scoutContact: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone || undefined,
        },
      });
      // Redirect to Mollie payment page
      window.location.href = res.checkoutUrl;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not start checkout.';
      setCheckoutError(msg);
      setCheckoutLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (notFound || !venue) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-2">
        <p className="text-lg font-medium text-neutral-900">Venue not found</p>
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
          ← Back to search
        </Button>
      </div>
    );
  }

  // Service fee calculation (mirrors backend: max(5, min(20, dayRate * 0.04)))
  const serviceFee = Math.max(5, Math.min(20, venue.dayRateEur * 0.04));
  const total = venue.dayRateEur + serviceFee;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left: photos + info */}
        <div className="lg:col-span-2">
          {/* Primary photo */}
          {venue.photoUrls.length > 0 ? (
            <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100">
              <Image
                src={venue.photoUrls[0]}
                alt={venue.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            </div>
          ) : (
            <div className="mb-4 aspect-[16/10] w-full rounded-2xl bg-neutral-100" />
          )}

          {/* Additional photos */}
          {venue.photoUrls.length > 1 && (
            <div className="mb-6 grid grid-cols-3 gap-2">
              {venue.photoUrls.slice(1, 4).map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={url} alt={`${venue.name} photo ${i + 2}`} fill className="object-cover" sizes="33vw" />
                </div>
              ))}
            </div>
          )}

          {/* Details */}
          <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{venue.name}</h1>
          <p className="mb-4 text-neutral-500">{venue.neighbourhood} · {venue.sizeM2} m²</p>

          {venue.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {venue.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
            </div>
          )}

          {venue.description && (
            <p className="text-sm leading-relaxed text-neutral-600">{venue.description}</p>
          )}
        </div>

        {/* Right: quote card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="mb-1 text-2xl font-semibold text-neutral-900">
              {formatEur(venue.dayRateEur)}
              <span className="text-base font-normal text-neutral-500"> / day</span>
            </p>
            <p className="mb-6 text-xs text-neutral-400">Instantly available</p>

            <div className="mb-6 flex flex-col gap-2 border-t border-neutral-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Day rate</span>
                <span className="text-neutral-900">{formatEur(venue.dayRateEur)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Eema service fee</span>
                <span className="text-neutral-900">{formatEur(serviceFee)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-semibold">
                <span>Total</span>
                <span>{formatEur(total)}</span>
              </div>
            </div>

            <Button onClick={handleReserveClick} className="w-full" size="lg">
              Reserve this space
            </Button>
            <p className="mt-3 text-center text-xs text-neutral-400">
              You won't be charged until you confirm
            </p>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !checkoutLoading && setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Confirm your reservation</h2>

            <div className="flex flex-col gap-4">
              <Input
                label="Shoot date"
                type="date"
                value={shootDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setShootDate(e.target.value)}
                required
              />
              <Input
                label="Your name"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                required
              />
              <Input
                label="Your email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                required
              />
              <Input
                label="Phone (optional)"
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
              />

              <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                <strong>{formatEur(total)}</strong> will be charged now.
                The venue owner gets <strong>{formatEur(venue.dayRateEur - serviceFee)}</strong> after your shoot is confirmed.
              </div>

              {checkoutError && (
                <p className="text-sm text-red-600">{checkoutError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setModalOpen(false)}
                  disabled={checkoutLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCheckout}
                  isLoading={checkoutLoading}
                  disabled={!shootDate || !contactName || !contactEmail}
                >
                  Pay {formatEur(total)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}