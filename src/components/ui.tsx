import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-heading font-bold text-primary-dark text-2xl tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-text-secondary text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pill({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?:
    | "neutral"
    | "primary"
    | "success"
    | "warn"
    | "danger"
    | "info";
  className?: string;
}) {
  const variants: Record<string, string> = {
    neutral: "bg-white/60 text-text-secondary border-border-light",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-50 text-green-700 border-green-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-600 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
  };
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20",
    outline:
      "bg-white/70 border border-border-light text-primary-dark hover:border-primary hover:text-primary",
    ghost:
      "text-text-secondary hover:text-primary hover:bg-primary/5",
    danger:
      "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
}) {
  return (
    <div className="text-center py-14 px-6">
      {icon && (
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      )}
      <h3 className="font-heading font-bold text-primary-dark text-base">
        {title}
      </h3>
      {message && (
        <p className="text-text-secondary text-sm mt-1 max-w-sm mx-auto">
          {message}
        </p>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <svg
        className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-text-subtle"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-3 rounded-full bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary focus:bg-white transition-colors"
      />
    </div>
  );
}
