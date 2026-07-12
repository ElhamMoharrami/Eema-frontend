'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { venueApi } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

const neighborhoods = [
  'De Pijp',
  'Jordaan',
  'Oud-West',
  'Oud-Zuid',
  'Oost',
  'Noord',
  'West',
  'Zuid',
  'Centrum',
  'Other',
];

const tags = [
  'Photoshoots',
  'Filming',
  'Events',
  'Meetings',
  'Workshops',
  'Parties',
  'Exhibitions',
  'Pop-up',
  'Production',
  'Creative',
];

function OnboardingForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    neighborhood: '',
    size: '',
    dayRate: '',
    selectedTags: [] as string[],
    description: '',
    otherNeighborhood: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.length < 2 || form.name.length > 120) {
      newErrors.name = 'Name must be between 2 and 120 characters';
    }

    if (!form.neighborhood) {
      newErrors.neighborhood = 'Neighborhood is required';
    } else if (form.neighborhood === 'Other' && (!form.otherNeighborhood || form.otherNeighborhood.trim() === '')) {
      newErrors.otherNeighborhood = 'Please specify your neighborhood';
    }

    const sizeNum = parseFloat(form.size);
    if (!form.size || isNaN(sizeNum) || sizeNum < 1 || sizeNum > 9999) {
      newErrors.size = 'Size must be a number between 1 and 9999';
    }

    const rateNum = parseFloat(form.dayRate);
    if (!form.dayRate || isNaN(rateNum) || rateNum < 0.01) {
      newErrors.dayRate = 'Day rate must be a number greater than 0';
    }

    if (form.selectedTags.length === 0) {
      newErrors.tags = 'Please select at least one tag';
    }

    if (form.description && form.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const neighborhoodValue = form.neighborhood === 'Other' ? form.otherNeighborhood : form.neighborhood;
        const response = await venueApi.create({
          name: form.name.trim(),
          neighbourhood: neighborhoodValue,
          sizeM2: parseInt(form.size),
          dayRateEur: parseFloat(form.dayRate),
          tags: form.selectedTags,
          description: form.description.trim() || undefined,
        });
        setSuccess(true);
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err: any) {
        if (err instanceof Response) {
          const errorData = await err.json();
          setErrors({ submit: errorData.message || 'Submission failed' });
        } else {
          setErrors({ submit: 'An unexpected error occurred' });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Venue submitted!</h1>
        <p className="mb-4 max-w-xl text-neutral-500">
          Thank you for submitting your venue. Our team will review it and get back to you shortly.
        </p>
        <button
          onClick={() => router.push('/')}
          className="btn btn-secondary"
        >
          Browse venues
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold text-neutral-900">List your venue</h1>
        <p className="text-neutral-600">
          Share your unique space with creators. Fill in the details below to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="Venue name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              hint="Enter a descriptive name for your venue (2-120 characters)"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Neighborhood
            </label>
            <select
              value={form.neighborhood}
              onChange={(e) => setForm({ ...form, neighborhood: e.target.value, otherNeighborhood: '' })}
              className="block w-full rounded-md border border-neutral-200 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-600 focus-visible:border-neutral-300"
            >
              <option value="">Select a neighborhood</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {errors.neighborhood && <p className="text-sm text-red-600">{errors.neighborhood}</p>}
            {form.neighborhood === 'Other' && (
              <div className="mt-2">
                <Input
                  label="Please specify your neighborhood"
                  value={form.otherNeighborhood}
                  onChange={(e) => setForm({ ...form, otherNeighborhood: e.target.value })}
                  required
                />
                {errors.otherNeighborhood && <p className="text-sm text-red-600">{errors.otherNeighborhood}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Size (m²)"
                type="number"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                required
                min="1"
                max="9999"
                hint="Enter the size in square meters (1-9999)"
              />
              {errors.size && <p className="text-sm text-red-600">{errors.size}</p>}
            </div>
            <div>
              <Input
                label="Day rate (EUR)"
                type="number"
                value={form.dayRate}
                onChange={(e) => setForm({ ...form, dayRate: e.target.value })}
                required
                step="0.01"
                min="0.01"
                hint="Enter the daily rate in euros (minimum 0.01)"
              />
              {errors.dayRate && <p className="text-sm text-red-600">{errors.dayRate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tags (select all that apply)
            </label>
            <div className="space-y-2">
              {tags.map((tag) => (
                <label key={tag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.selectedTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, selectedTags: [...form.selectedTags, tag] });
                      } else {
                        setForm({ ...form, selectedTags: form.selectedTags.filter((t) => t !== tag) });
                      }
                    }}
                    className="h-4 w-4 text-neutral-600"
                  />
                  <span className="text-sm text-neutral-700">{tag}</span>
                </label>
              ))}
            </div>
            {errors.tags && <p className="text-sm text-red-600 mt-2">{errors.tags}</p>}
          </div>

          <div>
            <Input
              label="Description (optional)"
              type="textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              hint="Describe your venue, its unique features, and what it's suitable for (max 1000 characters)"
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => router.push('/')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit venue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <AuthGuard requiredRole="OWNER">
      <OnboardingForm />
    </AuthGuard>
  );
}