export default function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="border border-rule bg-paper p-8 text-center"><div className="label label-ink">{title}</div><p className="mt-3 text-sm leading-relaxed text-taupe">{message}</p></div>;
}
