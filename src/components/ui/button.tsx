import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  pending?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--navy)] text-[var(--cream)] hover:bg-[var(--midnight)] focus-visible:ring-[var(--navy)] shadow-sm font-body font-semibold text-base rounded-full disabled:bg-[var(--navy)] disabled:text-[var(--cream)]/70 disabled:opacity-100",
  secondary: "bg-[var(--paper)] text-[var(--navy)] hover:bg-[var(--cream)] border border-[var(--mist)] hover:border-[var(--navy)] focus-visible:ring-[var(--navy)] font-body text-base font-semibold rounded-full",
  ghost: "bg-transparent text-[var(--navy)] hover:bg-[var(--paper)] border border-[var(--navy)] font-body text-base font-semibold rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      disabled = false,
      pending = false,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || pending;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={pending}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed active:scale-[0.98]",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {pending && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
