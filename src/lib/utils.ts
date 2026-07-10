// Format EUR amounts: 1234.5 → "€ 1.234,50"
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Format ISO date string to Dutch locale: "2026-07-15" → "15 juli 2026"
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

// Join CSS class names, filtering out falsy values
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Truncate text to n characters
export function truncate(text: string, n: number): string {
  return text.length > n ? text.slice(0, n) + '…' : text;
}
