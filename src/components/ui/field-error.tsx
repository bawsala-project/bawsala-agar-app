import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, message, children, ...props }, ref) => {
    const content = message || children;
    if (!content) return null;

    return (
      <p
        ref={ref}
        role="alert"
        className={cn("text-sm text-red-600 mt-1", className)}
        {...props}
      >
        {content}
      </p>
    );
  }
);

FieldError.displayName = "FieldError";
