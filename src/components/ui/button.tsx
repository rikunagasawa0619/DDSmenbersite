import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] px-5 py-3 text-[var(--color-primary-contrast)] shadow-[0_18px_45px_rgba(18,56,198,0.28)] hover:-translate-y-0.5 hover:brightness-[0.94]",
        secondary:
          "border border-[var(--color-outline)] bg-[var(--color-surface-raised)] px-5 py-3 text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        ghost:
          "px-3 py-2 text-[var(--color-muted-strong)] hover:bg-[var(--color-surface-inset)] hover:text-[var(--color-foreground)]",
      },
      size: {
        default: "",
        sm: "px-3 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
