export function Badge({
  children,
  variant = "default",
  className = ""
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  className?: string;
}) {
  // Define base classes
  const baseClasses = "inline-flex items-center rounded-border border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  // Define variant classes
  const variantClasses: Record<string, string> = {
    default: "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
    secondary: "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
    destructive: "border-destructive/50 bg-destructive/50 text-destructive hover:bg-destructive/100",
    outline: "border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}