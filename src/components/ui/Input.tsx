export function Input({
  label,
  type,
  autoComplete,
  value,
  onChange,
  required,
  hint,
  ...inputProps
}: {
  label?: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const isTextArea = typeof type === 'string' && type.toLowerCase() === 'textarea';

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-neutral-700">{label}</label>}
      {isTextArea ? (
        <textarea
          {...inputProps}
          value={value}
          onChange={onChange}
          required={required}
          className="block w-full rounded-md border border-neutral-200 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-600 focus-visible:border-neutral-300"
        />
      ) : (
        <input
          type={type || "text"}
          autoComplete={autoComplete || ""}
          value={value}
          onChange={onChange}
          required={required}
          {...inputProps}
          className="block w-full rounded-md border border-neutral-200 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-600 focus-visible:border-neutral-300"
        />
      )}
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}