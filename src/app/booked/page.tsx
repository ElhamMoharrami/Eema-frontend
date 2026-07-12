'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function BookedPage() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Reservation confirmed</h1>
      <p className="mb-1 max-w-sm text-neutral-500">
        Your payment is being processed. You'll receive a confirmation email with
        the venue owner's contact details and next steps.
      </p>
      <p className="mb-8 text-sm text-neutral-400">This usually takes less than a minute.</p>
      <Link href="/">
        <Button variant="secondary">Find another space</Button>
      </Link>
    </div>
  );
}