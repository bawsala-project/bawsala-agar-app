import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./field-error";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, error, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[var(--navy)] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "w-full rounded-2xl border border-[var(--mist)] bg-[var(--cream)] px-4 py-2.5 text-sm text-[var(--navy)] placeholder:text-[var(--dusty-blue)]/60 shadow-xs focus:bg-[var(--paper)] focus:border-[var(--navy)] focus:outline-none focus:ring-1 focus:ring-[var(--navy)] disabled:bg-[var(--cream)] disabled:opacity-50 transition-colors",
            error && "border-[#F6CBC8] focus:border-[#A62626] focus:ring-[#A62626]",
            className
          )}
          {...props}
        />
        {error && <FieldError id={errorId} message={error} />}
      </div>
    );
  }
);

Input.displayName = "Input";
