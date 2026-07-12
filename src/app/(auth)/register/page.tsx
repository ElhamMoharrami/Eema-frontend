'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cx } from '@/lib/utils';

type Role = 'SCOUT' | 'OWNER';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('SCOUT');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await register(email, password, fullName, role);
      router.push(role === 'OWNER' ? '/onboarding' : '/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.isConflict
          ? 'An account with this email already exists.'
          : err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Create account</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Already have one?{' '}
          <Link href="/login" className="text-neutral-900 underline underline-offset-2">
            Sign in
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required hint="At least 8 characters" />

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">I want to…</p>
            <div className="grid grid-cols-2 gap-3">
              {(['SCOUT', 'OWNER'] as Role[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cx(
                    'rounded-lg border-2 p-4 text-left transition-colors',
                    role === r
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-400',
                  )}
                >
                  <p className="text-sm font-medium text-neutral-900">
                    {r === 'SCOUT' ? 'Find locations' : 'List a space'}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {r === 'SCOUT'
                      ? 'I\'m looking for shoot locations'
                      : 'I have a venue to rent out'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={isLoading} className="mt-2 w-full" size="lg">
            Create account
          </Button>
        </form>
      </div>
    </div>
  );
}