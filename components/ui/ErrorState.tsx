export default function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return <div role="alert" className="border border-rule bg-paper p-8 text-center"><div className="label label-ink">{title}</div><p className="mt-3 text-sm leading-relaxed text-ochreDeep">{message}</p>{onRetry && <button onClick={onRetry} className="btn mt-6">Try again</button>}</div>;
}
