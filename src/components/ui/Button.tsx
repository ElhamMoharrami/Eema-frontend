import type { ButtonHTMLAttributes } from 'react';

export function Button({
  children,
  variant = "default",
  size = "default",
  isLoading = false,
  className = "",
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "disabled">) {
  // Define variants
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };

  // Define sizes
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10",
  };

  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.default;

  return (
    <button
      className={`${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <span className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        </span>
      ) : (
        <>{children}</>
      )}
    </button>
  );
}